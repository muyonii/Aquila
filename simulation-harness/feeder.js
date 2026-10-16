import readline from 'readline';
import { SETTINGS } from './config/settings.js';
import { NodeStateManager } from './src/core/NodeStateManager.js';
import { FlowGenerator } from './src/core/FlowGenerator.js';
import { ScenarioEngine } from './src/scenarios/ScenarioEngine.js';
import { FirebaseStreamer } from './src/streaming/FirebaseStreamer.js';
import { ConsoleDashboard } from './src/ui/ConsoleDashboard.js';

const stateManager   = new NodeStateManager();
const flowGenerator  = new FlowGenerator();
const scenarioEngine = new ScenarioEngine();
const streamer       = new FirebaseStreamer(SETTINGS.FIREBASE_DB_URL);

let tickCount = 0;

async function initializeHarness() {
    ConsoleDashboard.logAudit('SYS_INIT', 'Initializing infrastructure nodes and location metadata...');
    const states = stateManager.getAllStates();
    for (const state of Object.values(states)) {
        await streamer.initNodeMetadata(state);
    }
    ConsoleDashboard.logAudit('SYS_INIT', 'Firebase RTDB Hot Store metadata initialized for 10 nodes.');
}

async function runSimulationTick() {
    tickCount++;
    const hour = new Date().getHours();
    const overrides = scenarioEngine.getOverrides();
    const states = stateManager.getAllStates();
    let updatedCount = 0;

    for (const [nodeId, state] of Object.entries(states)) {
        if (stateManager.isPhysicalHardware(nodeId)) {
            continue;
        }

        if (overrides[nodeId]?.force_offline) {
            continue;
        }

        const flowLpm = flowGenerator.generateFlow(nodeId, hour, overrides);
        const telemetry = stateManager.updateTick(nodeId, flowLpm);

        const ok = await streamer.streamTelemetry(nodeId, telemetry);
        if (ok) updatedCount++;
    }

    ConsoleDashboard.logAudit('STREAM', `Pushed 7-field telemetry (DR-01) for ${updatedCount} nodes to Firebase RTDB.`);
    ConsoleDashboard.render(states, scenarioEngine.activeScenarioName, tickCount, SETTINGS.DEMO_MODE);
}

function setupKeyboardControls() {
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
    }

    process.stdin.on('keypress', async (str, key) => {
        if (key.name === 'q' || (key.ctrl && key.name === 'c')) {
            console.log('\n[Simulation Harness] Stopping feeder loop...');
            process.exit(0);
        }

        const inputKey = key.name || str;

        switch (inputKey) {
            case '1':
                scenarioEngine.setScenario('BASELINE_NORMAL');
                ConsoleDashboard.logAudit('SCENARIO', 'Activated BASELINE_NORMAL: Normal diurnal household demand.');
                break;
            case '2':
                scenarioEngine.setScenario('CRITICAL_LEAK');
                ConsoleDashboard.logAudit('SCENARIO', 'Latched CRITICAL_LEAK: 3.52 LPM rupture latched on NODE-B1-002.');
                ConsoleDashboard.logAudit('RULE_BR01', 'LDA ML probability evaluate: P >= 0.40 -> P1 Alert.');
                break;
            case '3':
                scenarioEngine.setScenario('EQUITY_DEFICIT');
                ConsoleDashboard.logAudit('SCENARIO', 'Latched EQUITY_DEFICIT: Starved terminal node NODE-B1-008.');
                ConsoleDashboard.logAudit('RULE_BR04', 'FEA Rawlsian RDI evaluate: RDI < 0.70 -> P2 Equity Deficit.');
                break;
            case '4':
                scenarioEngine.setScenario('CASCADE_BR06');
                ConsoleDashboard.logAudit('SCENARIO', 'Latched CASCADE_BR06: Parent leak 002 causing child shortage 004.');
                ConsoleDashboard.logAudit('RULE_BR06', 'CA Causal Arbitration: Suppressing child shortage due to parent leak.');
                break;
            case '5':
                scenarioEngine.setScenario('DROUGHT_BR05');
                ConsoleDashboard.logAudit('SCENARIO', 'Latched DROUGHT_BR05: System supply dropped < 50 LPD (WHO Floor).');
                ConsoleDashboard.logAudit('RULE_BR05', 'FEA Shortage Override: Suspending individual equity alarms.');
                break;
            case '6':
                scenarioEngine.setScenario('REPAIR_SUCCESS');
                ConsoleDashboard.logAudit('SCENARIO', 'Latched REPAIR_SUCCESS: Quiet seal (<= 0.05 LPM) latched on NODE-B1-002.');
                ConsoleDashboard.logAudit('RULE_BR07', '15-Min Verification Loop: Observing quiet seal -> Auto-Close.');
                break;
            case '7':
                scenarioEngine.setScenario('REPAIR_FAILED');
                ConsoleDashboard.logAudit('SCENARIO', 'Latched REPAIR_FAILED: Recurrent burst (3.20 LPM) latched on NODE-B1-002.');
                ConsoleDashboard.logAudit('RULE_BR07', '15-Min Verification Loop: Recurrent flow detected -> REPAIR_FAILED.');
                break;
            case '8': 
                scenarioEngine.latchNodeOverride('NODE-B1-003', { force_offline: true });
                scenarioEngine.activeScenarioName = "Offline Watchdog (NODE-B1-003 Dropped)";
                ConsoleDashboard.logAudit('SCENARIO', 'Latched OFFLINE state for NODE-B1-003 (> 45s timeout).');
                ConsoleDashboard.logAudit('WATCHDOG', 'LDA/FEA Watchdog evaluate: Node state -> OFFLINE.');
                break;
            case '9': 
                const currentStatus = stateManager.states['NODE-B1-005'].status;
                const nextStatus = currentStatus === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE';
                stateManager.setNodeStatus('NODE-B1-005', nextStatus);
                await streamer.initNodeMetadata(stateManager.states['NODE-B1-005']);
                ConsoleDashboard.logAudit('SUPPRESSION', `Latched NODE-B1-005 status to ${nextStatus}. AI alarms suppressed.`);
                break;
            case '0': 
                scenarioEngine.resetToOriginalState();
                for (const nodeId of Object.keys(stateManager.states)) {
                    stateManager.setNodeStatus(nodeId, 'ACTIVE');
                    await streamer.initNodeMetadata(stateManager.states[nodeId]);
                }
                ConsoleDashboard.logAudit('RESTORE', 'Master Reset: All latched scenario overrides cleared. Returned to original state.');
                break;
        }

        await runSimulationTick();
    });
}

await initializeHarness();
setupKeyboardControls();

await runSimulationTick();
setInterval(runSimulationTick, SETTINGS.TICK_INTERVAL_MS);