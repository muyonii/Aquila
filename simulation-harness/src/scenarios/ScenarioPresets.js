/**
 * Pre-packaged Hydraulic & Operational Test Scenarios
 */
export const SCENARIO_PRESETS = {
    BASELINE_NORMAL: {
        name: "Baseline Normal Operations",
        description: "Standard diurnal household demand curves across all community nodes.",
        overrides: {}
    },
    CRITICAL_LEAK: {
        name: "P1 Critical Sub-surface Pipe Rupture",
        description: "Sustained 3.52 LPM flat variance rupture on NODE-B1-002.",
        overrides: {
            'NODE-B1-002': { fixed_flow_lpm: 3.52, std: 0.03 }
        }
    },
    EQUITY_DEFICIT: {
        name: "P2 Rawlsian Distribution Inequity",
        description: "High upstream consumption starves terminal node NODE-B1-008 (RDI < 0.70).",
        overrides: {
            'NODE-B1-008': { force_zero: true }
        }
    },
    CASCADE_BR06: {
        name: "Rule BR-06 Upstream Causal Cascade",
        description: "Rupture on parent NODE-B1-002 starves child NODE-B1-004 (Tests downstream alarm suppression).",
        overrides: {
            'NODE-B1-002': { fixed_flow_lpm: 3.52, std: 0.03 },
            'NODE-B1-004': { force_zero: true }
        }
    },
    DROUGHT_BR05: {
        name: "Rule BR-05 Municipal Shortage Override",
        description: "System-wide supply drop below 50 LPD WHO threshold (Suspends individual equity complaints).",
        overrides: {
            'NODE-B1-002': { fixed_flow_lpm: 0.15 },
            'NODE-B1-003': { fixed_flow_lpm: 0.15 },
            'NODE-B1-004': { fixed_flow_lpm: 0.10 },
            'NODE-B1-005': { fixed_flow_lpm: 0.10 },
            'NODE-B1-006': { fixed_flow_lpm: 0.10 },
            'NODE-B1-007': { fixed_flow_lpm: 0.10 },
            'NODE-B1-008': { fixed_flow_lpm: 0.05 },
            'NODE-B1-009': { fixed_flow_lpm: 0.05 },
            'NODE-B1-010': { fixed_flow_lpm: 0.05 }
        }
    },
    REPAIR_SUCCESS: {
        name: "Rule BR-07 Repair Verification (Quiet Seal Success)",
        description: "Flow stays <= 0.05 LPM for 15 minutes to trigger automated ticket closure.",
        overrides: {
            'NODE-B1-002': { fixed_flow_lpm: 0.02, std: 0.005 }
        }
    },
    REPAIR_FAILED: {
        name: "Rule BR-07 Repair Verification (Recurrent Burst Failure)",
        description: "Flow bursts to 3.20 LPM during 15-min observation window to trigger repair failure.",
        overrides: {
            'NODE-B1-002': { fixed_flow_lpm: 3.20, std: 0.04 }
        }
    }
};