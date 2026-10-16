import { SETTINGS } from './config/settings.js';
import { BlackboardService } from './src/services/BlackboardService.js';
import { WebhookDispatcher } from './src/services/WebhookDispatcher.js';
import { HeartbeatMonitor } from './src/services/HeartbeatMonitor.js';
import { LeakDetectionAgent } from './src/agents/LeakDetectionAgent.js';
import { FairnessEvaluationAgent } from './src/agents/FairnessEvaluationAgent.js';
import { CoordinatorAgent } from './src/agents/CoordinatorAgent.js';

console.log("===============================================================");
console.log(" AQUILA Persistent Multi-Agent System Engine (CMP-MAS-01)");
console.log(` Target Blackboard : ${SETTINGS.FIREBASE_DB_URL}`);
console.log(` Transactional API  : ${SETTINGS.BACKEND_WEBHOOK_URL}`);
console.log(" Operational Agents : LDA, FEA, CA, RA (Template Method OOP)");
console.log(" Watchdog System    : Active (30s Circuit Breaker Liveness)");
console.log("===============================================================\n");

// 1. Initialize Core Shared Services
const blackboard = new BlackboardService(SETTINGS.FIREBASE_DB_URL);
const dispatcher = new WebhookDispatcher(SETTINGS.BACKEND_WEBHOOK_URL, SETTINGS.WEBHOOK_SECRET);
const monitor    = new HeartbeatMonitor(blackboard, SETTINGS.CIRCUIT_BREAKER_TIMEOUT_SEC);

// 2. Instantiate Autonomous Agents
const lda = new LeakDetectionAgent(blackboard);
const fea = new FairnessEvaluationAgent(blackboard);
const ca  = new CoordinatorAgent(blackboard, dispatcher);

let isCycleRunning = false;

// 3. Synchronized Agent Coordination Cycle (Senses Hot Store ➔ Deliberates ➔ Dispatches Cold Store)
async function runAgentSystem() {
    if (isCycleRunning) {
        console.warn('⚠️ [MAS Engine] Previous cycle still in progress; skipping overlapping tick.');
        return;
    }

    isCycleRunning = true;
    const startTime = Date.now();
    const timeStr = new Date().toLocaleTimeString();
    console.log(`[${timeStr}] --- Executing Agent Coordination Cycle ---`);

    try {
        // Step A: Health & Liveness Watchdog Check (FR-DSS-03)
        const health = await monitor.checkLiveness();
        if (!health.systemHealthy) {
            console.warn(`⚠️ [Watchdog Alert] Degraded agents detected: ${health.degradedAgents.join(', ')}`);
        }

        // Step B: LDA — Senses flow & detects leaks via Random Forest Classifier (CMP-LDA-01)
        await lda.executeCycle();

        // Step C: FEA — Senses volume deltas & evaluates Rawlsian fairness (CMP-FEA-01)
        await fea.executeCycle();

        // Step D: CA — Recursive DAG arbitration, Action Card synthesis, & Webhook dispatch (CMP-CA-01)
        await ca.executeCycle();

        const durationMs = Date.now() - startTime;
        console.log(`[${timeStr}] ✔ Coordination Cycle Completed in ${durationMs}ms`);

    } catch (cycleError) {
        console.error('❌ [MAS Engine] Critical Cycle Execution Error:', cycleError.message);
    } finally {
        isCycleRunning = false;
    }
}

// 4. Start immediately, then execute every 15s
runAgentSystem();
const intervalHandle = setInterval(runAgentSystem, SETTINGS.CYCLE_INTERVAL_MS);

// 5. Graceful Process Termination (SIGINT / SIGTERM)
async function handleShutdown(signal) {
    console.log(`\n[MAS Engine] Received ${signal}. Shutting down coordination loop safely...`);
    clearInterval(intervalHandle);

    try {
        // Attempt to post offline status to Firebase heartbeats on shutdown
        await blackboard.updateHeartbeat("CMP-LDA-01", "DEGRADED");
        await blackboard.updateHeartbeat("CMP-FEA-01", "DEGRADED");
        await blackboard.updateHeartbeat("CMP-CA-01", "DEGRADED");
    } catch (e) {
        // Ignore network errors during immediate exit
    }

    console.log('[MAS Engine] Engine stopped safely.');
    process.exit(0);
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

// 6. Global Unhandled Exception & Promise Rejection Safeguards
process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ [MAS Engine] Unhandled Promise Rejection:', reason?.message || reason);
});

process.on('uncaughtException', (error) => {
    console.error('❌ [MAS Engine] Uncaught Exception:', error.message);
});