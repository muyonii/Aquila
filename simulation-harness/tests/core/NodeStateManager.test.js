import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { NodeStateManager } from '../../src/core/NodeStateManager.js';

describe('NodeStateManager (Odometer & State Wrapper)', () => {

    test('Initializes 10 topology nodes matching database topology', () => {
        const manager = new NodeStateManager();
        const states = manager.getAllStates();
        const nodeIds = Object.keys(states);

        assert.equal(nodeIds.length, 10);
        assert.ok(nodeIds.includes('NODE-B1-001'));
        assert.ok(nodeIds.includes('NODE-B1-010'));
    });

    test('Physical Hardware Bypass Guard: NODE-B1-001 is physical, NODE-B1-002 is simulated', () => {
        const manager = new NodeStateManager();
        
        assert.equal(manager.isPhysicalHardware('NODE-B1-001'), true);
        assert.equal(manager.isPhysicalHardware('NODE-B1-002'), false);
    });

    test('Monotonic Cumulative Volume Integration: V_k = V_{k-1} + (Q * 0.25)', () => {
        const manager = new NodeStateManager();
        const initialVol = manager.states['NODE-B1-002'].cumulative_liters;
        
        // Simulate a 15-second tick with Q = 4.0 LPM -> delta = 4.0 * (15/60) = 1.0 Liter
        const payload = manager.updateTick('NODE-B1-002', 4.0);

        assert.equal(payload.cumulative_liters, initialVol + 1.0);
        assert.equal(payload.packet_sequence, 2);
    });

    test('7-Field Telemetry Contract Compliance (DR-01)', () => {
        const manager = new NodeStateManager();
        const payload = manager.updateTick('NODE-B1-002', 3.5);

        const requiredFields = [
            'node_id',
            'packet_sequence',
            'timestamp',
            'flow_rate_lpm',
            'cumulative_liters',
            'battery_voltage',
            'is_simulated'
        ];

        for (const field of requiredFields) {
            assert.ok(field in payload, `Missing required 7-field contract key: ${field}`);
            assert.notEqual(payload[field], null);
            assert.notEqual(payload[field], undefined);
        }

        assert.equal(payload.node_id, 'NODE-B1-002');
        assert.equal(payload.is_simulated, true);
        assert.equal(payload.flow_rate_lpm, 3.5);
    });

    test('Node Status Modification (ACTIVE, MAINTENANCE, FAULT)', () => {
        const manager = new NodeStateManager();
        
        manager.setNodeStatus('NODE-B1-005', 'MAINTENANCE');
        assert.equal(manager.states['NODE-B1-005'].status, 'MAINTENANCE');

        manager.setNodeStatus('NODE-B1-005', 'FAULT');
        assert.equal(manager.states['NODE-B1-005'].status, 'FAULT');
    });
});