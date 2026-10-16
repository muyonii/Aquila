/**
 * ConsoleDashboard
 * Renders a dual-panel CLI dashboard:
 *   Top Panel: Live Node Telemetry Table
 *   Bottom Panel: Live Activity Audit Stream (INV-06)
 */
export class ConsoleDashboard {
    static auditLogs = [];

    static logAudit(category, message) {
        const timeStr = new Date().toLocaleTimeString();
        this.auditLogs.push(`[${timeStr}] [${category}] ${message}`);
        if (this.auditLogs.length > 5) {
            this.auditLogs.shift();
        }
    }

    static render(nodeStates, activeScenarioName, tickCount, isDemoMode = true) {
        console.clear();
        const timeStr = new Date().toLocaleTimeString();

        console.log("==========================================================================================");
        console.log(" AQUILA HYDRAULIC SIMULATION HARNESS — LIVE DASHBOARD & AUDIT STREAM");
        console.log(` Target: Firebase RTDB | Mode: ${isDemoMode ? 'DEMO (Fast 1-Tick)' : 'PRODUCTION'} | Tick: ${tickCount} | PST: ${timeStr}`);
        console.log(` Active Scenario: [${activeScenarioName}]`);
        console.log("==========================================================================================");
        console.log(
            ` ${"NODE ID".padEnd(12)} | ` +
            `${"LOCATION ADDRESS / LANDMARK".padEnd(38)} | ` +
            `${"FLOW (LPM)".padEnd(10)} | ` +
            `${"TOTAL (L)".padEnd(10)} | ` +
            `${"STATUS"}`
        );
        console.log("------------------------------------------------------------------------------------------");

        for (const [nodeId, state] of Object.entries(nodeStates)) {
            let flowStr = state.is_physical ? "[HARDWARE]" : `${state.last_flow_lpm.toFixed(2)} LPM`;
            if (state.last_flow_lpm > 2.5 && !state.is_physical) {
                flowStr += " ⚠️";
            }

            const locStr = state.location_name.length > 38 
                ? state.location_name.substring(0, 35) + "..." 
                : state.location_name.padEnd(38);

            console.log(
                ` ${state.node_id.padEnd(12)} | ` +
                `${locStr} | ` +
                `${flowStr.padEnd(10)} | ` +
                `${state.cumulative_liters.toFixed(1).padEnd(10)} | ` +
                `${state.status}`
            );
        }

        console.log("==========================================================================================");
        console.log(" REAL-TIME SYSTEM ACTIVITY AUDIT STREAM (RULE & EVENT VERIFICATION):");
        if (this.auditLogs.length === 0) {
            console.log(" [System initialized. Awaiting first telemetry tick...]");
        } else {
            for (const log of this.auditLogs) {
                console.log(` ${log}`);
            }
        }

        console.log("==========================================================================================");
        console.log(" SCENARIO CONTROLS:");
        console.log("   [1] Baseline Normal    [2] Leak Node 002    [3] Equity Shortage Node 008");
        console.log("   [4] Cascade Rule BR-06 [5] Drought BR-05    [6] Repair Success (Quiet)");
        console.log("   [7] Repair Fail Burst  [8] Offline Watchdog [9] Toggle Maintenance Node 005");
        console.log("   [0] Reset All Baseline [q] Quit Harness");
        console.log("==========================================================================================");
    }
}