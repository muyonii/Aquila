import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { FairnessEvaluationAgent } from '../../src/agents/FairnessEvaluationAgent.js';

describe('FairnessEvaluationAgent (Rawlsian Equity & BR-05)', () => {
    test('Calculates RDI and flags disadvantaged households below 0.70 community mean', async () => {
        const fea = new FairnessEvaluationAgent({}, 86400);

        const nodesData = {
            'NODE-B1-001': {
                status: 'ACTIVE',
                telemetry: { cumulative_liters: 100.0, timestamp: Math.floor(Date.now() / 1000) }
            },
            'NODE-B1-002': {
                status: 'ACTIVE',
                telemetry: { cumulative_liters: 1000.0, timestamp: Math.floor(Date.now() / 1000) }
            }
        };

        // Populate baseline history representing a 24-hour window
        const baselineTime = Math.floor(Date.now() / 1000) - 86400;
        fea.volumeHistory['NODE-B1-001'] = [{ timestamp: baselineTime, liters: 0.0 }];
        fea.volumeHistory['NODE-B1-002'] = [{ timestamp: baselineTime, liters: 0.0 }];

        const decisions = await fea.deliberate(nodesData);
        // Total delta = 1100, activeCount = 2, mean = 550.
        // Node 1: delta = 100, RDI = 100 / 550 = 0.182 (< 0.70) -> Disadvantaged
        // Node 2: delta = 1000, RDI = 1000 / 550 = 1.818 (> 0.70) -> Not disadvantaged
        const node1Decision = decisions.find(d => d.node_id === 'NODE-B1-001');
        const node2Decision = decisions.find(d => d.node_id === 'NODE-B1-002');

        assert.equal(node1Decision.is_disadvantaged, true);
        assert.equal(node2Decision.is_disadvantaged, false);
    });

    test('BR-05: Municipal Shortage Guard suspends individual flags when projected mean < 50 LPD', async () => {
        const fea = new FairnessEvaluationAgent({}, 86400);

        const nodesData = {
            'NODE-B1-001': {
                status: 'ACTIVE',
                telemetry: { cumulative_liters: 10.0, timestamp: Math.floor(Date.now() / 1000) }
            },
            'NODE-B1-002': {
                status: 'ACTIVE',
                telemetry: { cumulative_liters: 20.0, timestamp: Math.floor(Date.now() / 1000) }
            }
        };

        const baselineTime = Math.floor(Date.now() / 1000) - 86400;
        fea.volumeHistory['NODE-B1-001'] = [{ timestamp: baselineTime, liters: 0.0 }];
        fea.volumeHistory['NODE-B1-002'] = [{ timestamp: baselineTime, liters: 0.0 }];

        const decisions = await fea.deliberate(nodesData);
        // Total delta = 30, Mean = 15 LPD (< 50 LPD Municipal Shortage threshold)
        for (const decision of decisions) {
            assert.equal(decision.override_active, true, 'Shortage override should be active');
            assert.equal(decision.is_disadvantaged, false, 'Disadvantage should be suppressed during drought/shortage');
        }
    });

    test('Ignores nodes flagged as MAINTENANCE and purges their historical buffer', async () => {
        const fea = new FairnessEvaluationAgent({});
        const nodesData = {
            'NODE-B1-001': {
                status: 'MAINTENANCE',
                telemetry: { cumulative_liters: 5.0, timestamp: Math.floor(Date.now() / 1000) }
            },
            'NODE-B1-002': {
                status: 'ACTIVE',
                telemetry: { cumulative_liters: 100.0, timestamp: Math.floor(Date.now() / 1000) }
            }
        };

        fea.volumeHistory['NODE-B1-001'] = [{ timestamp: Math.floor(Date.now() / 1000) - 86400, liters: 0.0 }];
        fea.volumeHistory['NODE-B1-002'] = [{ timestamp: Math.floor(Date.now() / 1000) - 86400, liters: 0.0 }];

        const decisions = await fea.deliberate(nodesData);
        assert.equal(decisions.length, 1);
        assert.equal(decisions[0].node_id, 'NODE-B1-002');
        assert.equal(fea.volumeHistory['NODE-B1-001'], undefined, 'Maintenance node buffer must be purged');
    });

    test('Warm-up Guard: Suppresses alerts during cold boot (elapsed < 30s)', async () => {
        const fea = new FairnessEvaluationAgent({});
        const now = Math.floor(Date.now() / 1000);

        const nodesData = {
            'NODE-B1-001': {
                status: 'ACTIVE',
                telemetry: { cumulative_liters: 0.1, timestamp: now }
            },
            'NODE-B1-002': {
                status: 'ACTIVE',
                telemetry: { cumulative_liters: 1.0, timestamp: now }
            }
        };

        // First packet ever seen (elapsed = 0s < 30s)
        const decisions = await fea.deliberate(nodesData);
        for (const decision of decisions) {
            assert.equal(decision.is_warming_up, true);
            assert.equal(decision.is_disadvantaged, false);
            assert.equal(decision.override_active, false);
        }
    });
});