import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { LeakDetectionAgent } from '../../src/agents/LeakDetectionAgent.js';

describe('LeakDetectionAgent (Sensing & Deliberation Lifecycle)', () => {
    test('Maintenance Mode: Actively clears blackboard with neutral status', async () => {
        const lda = new LeakDetectionAgent({});
        const now = Math.floor(Date.now() / 1000);

        const nodesData = {
            'NODE-B1-002': {
                status: 'MAINTENANCE',
                telemetry: { flow_rate_lpm: 3.5, timestamp: now }
            }
        };

        const decisions = await lda.deliberate(nodesData);
        assert.equal(decisions.length, 1);
        assert.equal(decisions[0].node_id, 'NODE-B1-002');
        assert.equal(decisions[0].classification, 'MAINTENANCE', 'Must actively publish MAINTENANCE status');
        assert.equal(decisions[0].leak_probability, 0.0, 'Leak probability must be 0.0 during maintenance');
    });

    test('Fault Mode: Hardware fault suppresses alarms and publishes FAULT classification', async () => {
        const lda = new LeakDetectionAgent({});
        const now = Math.floor(Date.now() / 1000);

        const nodesData = {
            'NODE-B1-003': {
                status: 'FAULT',
                telemetry: { flow_rate_lpm: 4.8, timestamp: now }
            }
        };

        const decisions = await lda.deliberate(nodesData);
        assert.equal(decisions.length, 1);
        assert.equal(decisions[0].node_id, 'NODE-B1-003');
        assert.equal(decisions[0].classification, 'FAULT', 'Must publish FAULT classification');
        assert.equal(decisions[0].leak_probability, 0.0, 'Leak probability must be 0.0 on hardware fault');
    });

    test('Stale Telemetry Watchdog: Marks node OFFLINE if packet age > 45s', async () => {
        const lda = new LeakDetectionAgent({});
        const now = Math.floor(Date.now() / 1000);

        const nodesData = {
            'NODE-B1-002': {
                status: 'ACTIVE',
                telemetry: { flow_rate_lpm: 2.5, timestamp: now - 50 } // 50s old (> 45s threshold)
            }
        };

        const decisions = await lda.deliberate(nodesData);
        assert.equal(decisions.length, 1);
        assert.equal(decisions[0].classification, 'OFFLINE');
        assert.equal(decisions[0].leak_probability, 0.0);
    });

    test('Early-Stage Anomaly (< 30s): Classifies flow as SUSPICIOUS', async () => {
        const lda = new LeakDetectionAgent({});
        const now = Math.floor(Date.now() / 1000);

        const nodesData = {
            'NODE-B1-002': {
                status: 'ACTIVE',
                telemetry: { flow_rate_lpm: 3.42, timestamp: now }
            }
        };

        // Populate history buffer with only 10s of duration (< 30s)
        lda.history['NODE-B1-002'] = {
            activeSince: now - 10,
            buffer: [3.42, 3.40, 3.43]
        };

        const decisions = await lda.deliberate(nodesData);
        assert.equal(decisions.length, 1);
        assert.equal(decisions[0].classification, 'SUSPICIOUS', 'Bursts < 30s must be classified as SUSPICIOUS');
        assert.ok(decisions[0].leak_probability >= 0.40);
    });

    test('Sustained Rupture (>= 30s): Classifies flow as LEAK', async () => {
        const lda = new LeakDetectionAgent({});
        const now = Math.floor(Date.now() / 1000);

        const nodesData = {
            'NODE-B1-002': {
                status: 'ACTIVE',
                telemetry: { flow_rate_lpm: 3.42, timestamp: now }
            }
        };

        // Populate history buffer with 35s of sustained flow (>= 30s)
        lda.history['NODE-B1-002'] = {
            activeSince: now - 35,
            buffer: [3.42, 3.40, 3.43, 3.41]
        };

        const decisions = await lda.deliberate(nodesData);
        assert.equal(decisions.length, 1);
        assert.equal(decisions[0].classification, 'LEAK', 'Bursts >= 30s must be classified as LEAK');
        assert.ok(decisions[0].leak_probability >= 0.40);
    });
});