import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { CoordinatorAgent } from '../../src/agents/CoordinatorAgent.js';

describe('CoordinatorAgent (Recursive DAG Arbitration & Action Cards)', () => {
    const mockBlackboard = {};
    const mockDispatcher = { dispatchIncident: async () => {} };

    test('findUpstreamLeak: Correctly detects direct leaking parent', () => {
        const ca = new CoordinatorAgent(mockBlackboard, mockDispatcher);
        ca.dagMap = { 'NODE-B1-002': 'NODE-B1-001' };

        const leakHypotheses = {
            'NODE-B1-001': { classification: 'LEAK' }
        };

        const upstream = ca.findUpstreamLeak('NODE-B1-002', leakHypotheses);
        assert.equal(upstream, 'NODE-B1-001');
    });

    test('findUpstreamLeak: Traverses multi-tier ancestor branch (Grandparent leak)', () => {
        const ca = new CoordinatorAgent(mockBlackboard, mockDispatcher);
        ca.dagMap = {
            'NODE-B1-004': 'NODE-B1-002',
            'NODE-B1-008': 'NODE-B1-004'
        };

        const leakHypotheses = {
            'NODE-B1-002': { classification: 'LEAK' },
            'NODE-B1-004': { classification: 'NORMAL' }
        };

        const upstream = ca.findUpstreamLeak('NODE-B1-008', leakHypotheses);
        assert.equal(upstream, 'NODE-B1-002');
    });

    test('BR-06: Deliberation suppresses fairness deficit when induced by upstream leak', async () => {
        const ca = new CoordinatorAgent(mockBlackboard, mockDispatcher);
        ca.dagMap = {
            'NODE-B1-004': 'NODE-B1-002'
        };

        const leakHypotheses = {
            'NODE-B1-002': { classification: 'LEAK' }
        };
        const fairnessHypotheses = {
            'NODE-B1-004': { is_disadvantaged: true } // Starved because 002 is leaking
        };

        const incidents = await ca.deliberate({ leakHypotheses, fairnessHypotheses });

        // Should only spawn 1 incident (the P1 CRITICAL_LEAK for 002), and suppress 004
        assert.equal(incidents.length, 1);
        assert.equal(incidents[0].node_id, 'NODE-B1-002');
        assert.equal(incidents[0].incident_type, 'CRITICAL_LEAK');
        assert.equal(incidents[0].severity_level, 'P1');
    });

    test('Deliberation creates P2 incident for genuine uninduced fairness deficit', async () => {
        const ca = new CoordinatorAgent(mockBlackboard, mockDispatcher);
        ca.dagMap = { 'NODE-B1-004': 'NODE-B1-002' };

        const leakHypotheses = {};
        const fairnessHypotheses = {
            'NODE-B1-004': { is_disadvantaged: true }
        };

        const incidents = await ca.deliberate({ leakHypotheses, fairnessHypotheses });
        assert.equal(incidents.length, 1);
        assert.equal(incidents[0].node_id, 'NODE-B1-004');
        assert.equal(incidents[0].incident_type, 'FAIRNESS_DEFICIT');
        assert.equal(incidents[0].severity_level, 'P2');
        assert.ok(incidents[0].recommendation.action_directive.includes('Check water pressure'));
    });

    test('Cycle-Defense: Circular parent references do not enter infinite loops', () => {
        const ca = new CoordinatorAgent(mockBlackboard, mockDispatcher);
        // Create deliberate loop: 001 -> 002 -> 001
        ca.dagMap = {
            'NODE-B1-001': 'NODE-B1-002',
            'NODE-B1-002': 'NODE-B1-001'
        };

        const leakHypotheses = {
            'NODE-B1-003': { classification: 'LEAK' }
        };

        // Must terminate safely and return null
        const upstream = ca.findUpstreamLeak('NODE-B1-001', leakHypotheses);
        assert.equal(upstream, null);
    });

    test('Resilient Caching: Preserves existing topology cache on network failure', async () => {
        const ca = new CoordinatorAgent(mockBlackboard, mockDispatcher);
        ca.dagMap = {
            'NODE-B1-050': 'NODE-B1-049',
            'NODE-B1-049': 'NODE-B1-001'
        };
        ca.lastDagSync = 0; // Force sync attempt

        // Mock global fetch to throw network error
        const originalFetch = globalThis.fetch;
        globalThis.fetch = async () => { throw new Error('Connection refused'); };

        try {
            await ca.syncDagHierarchy();
            // Cache must NOT be wiped out with the 7-node default
            assert.equal(ca.dagMap['NODE-B1-050'], 'NODE-B1-049');
            assert.equal(ca.hasDegradedTopology, true);
        } finally {
            globalThis.fetch = originalFetch;
        }
    });

    test('Deliberation creates P3 incident for SUSPICIOUS flow anomaly with updated directive', async () => {
        const ca = new CoordinatorAgent(mockBlackboard, mockDispatcher);
        ca.dagMap = { 'NODE-B1-002': 'NODE-B1-001' };

        const leakHypotheses = {
            'NODE-B1-002': { classification: 'SUSPICIOUS' }
        };
        const fairnessHypotheses = {};

        const incidents = await ca.deliberate({ leakHypotheses, fairnessHypotheses });
        
        assert.equal(incidents.length, 1, 'Exactly one incident must be spawned for suspicious anomaly');
        assert.equal(incidents[0].node_id, 'NODE-B1-002');
        assert.equal(incidents[0].incident_type, 'SUSPICIOUS_USAGE');
        assert.equal(incidents[0].severity_level, 'P3');
        assert.equal(incidents[0].recommendation.priority, 'P3');
        // Aligned with the simplified, field-ready RecommendationAgent directive
        assert.ok(incidents[0].recommendation.action_directive.includes('Continuous water flow'));
    });

    test('Self-Rupture Rule: Deliberation suppresses fairness deficit on leaking node itself', async () => {
        const ca = new CoordinatorAgent(mockBlackboard, mockDispatcher);
        ca.dagMap = { 'NODE-B1-002': 'NODE-B1-001' };

        // Node 002 has a critical leak AND is experiencing a deficit on its own meter
        const leakHypotheses = {
            'NODE-B1-002': { classification: 'LEAK' }
        };
        const fairnessHypotheses = {
            'NODE-B1-002': { is_disadvantaged: true }
        };

        const incidents = await ca.deliberate({ leakHypotheses, fairnessHypotheses });

        // Must spawn ONLY 1 incident (P1 CRITICAL_LEAK) and suppress the fairness alarm on itself
        assert.equal(incidents.length, 1, 'Must spawn only 1 incident (no double-ticketing)');
        assert.equal(incidents[0].node_id, 'NODE-B1-002');
        assert.equal(incidents[0].incident_type, 'CRITICAL_LEAK');
        assert.equal(incidents[0].severity_level, 'P1');
    });

    test('Metadata Enrichment: Action card incorporates location name when cached', async () => {
        const ca = new CoordinatorAgent(mockBlackboard, mockDispatcher);
        ca.dagMap = { 'NODE-B1-001': null };
        ca.nodeMetadata = {
            'NODE-B1-001': { location_name: 'Lot 14 Blk 2, Bougainvillea St.', household_label: 'Household 01' }
        };

        const leakHypotheses = {
            'NODE-B1-001': { classification: 'LEAK' }
        };
        const fairnessHypotheses = {};

        const incidents = await ca.deliberate({ leakHypotheses, fairnessHypotheses });

        assert.equal(incidents.length, 1);
        assert.ok(incidents[0].recommendation.action_directive.includes('Lot 14 Blk 2, Bougainvillea St.'));
    });
});