import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { TelemetryContract } from '../../src/contracts/TelemetryContract.js';

describe('TelemetryContract (7-Field Validation & Boundary Integrity)', () => {
    test('Valid telemetry packet passes validation', () => {
        const validPacket = {
            node_id: 'NODE-B1-001',
            packet_sequence: 142,
            timestamp: 1727500000,
            flow_rate_lpm: 3.42,
            cumulative_liters: 1540.20,
            battery_voltage: 4.12,
            is_simulated: false
        };
        assert.equal(TelemetryContract.validate(validPacket), true);
    });

    test('Missing required field fails validation', () => {
        const invalidPacket = {
            node_id: 'NODE-B1-001',
            timestamp: 1727500000,
            flow_rate_lpm: 3.42
            // Missing packet_sequence, cumulative_liters, battery_voltage, is_simulated
        };
        assert.equal(TelemetryContract.validate(invalidPacket), false);
    });

    test('Null or non-object payload fails validation', () => {
        assert.equal(TelemetryContract.validate(null), false);
        assert.equal(TelemetryContract.validate('string-payload'), false);
        assert.equal(TelemetryContract.validate([]), false);
    });

    test('Negative sequence number fails validation', () => {
        const invalid = {
            node_id: 'NODE-B1-001',
            packet_sequence: -1,
            timestamp: 1727500000,
            flow_rate_lpm: 3.42,
            cumulative_liters: 100.0,
            battery_voltage: 4.10,
            is_simulated: false
        };
        assert.equal(TelemetryContract.validate(invalid), false);
    });

    test('Negative cumulative liters fails validation', () => {
        const invalid = {
            node_id: 'NODE-B1-001',
            packet_sequence: 1,
            timestamp: 1727500000,
            flow_rate_lpm: 3.42,
            cumulative_liters: -0.5,
            battery_voltage: 4.10,
            is_simulated: false
        };
        assert.equal(TelemetryContract.validate(invalid), false);
    });

    test('Flow rate exceeding hydraulic capacity (> 45 LPM) fails validation', () => {
        const invalid = {
            node_id: 'NODE-B1-001',
            packet_sequence: 1,
            timestamp: 1727500000,
            flow_rate_lpm: 46.5,
            cumulative_liters: 100.0,
            battery_voltage: 4.10,
            is_simulated: false
        };
        assert.equal(TelemetryContract.validate(invalid), false);
    });

    test('Battery voltage out of bounds (> 6.0V) fails validation', () => {
        const invalid = {
            node_id: 'NODE-B1-001',
            packet_sequence: 1,
            timestamp: 1727500000,
            flow_rate_lpm: 2.0,
            cumulative_liters: 100.0,
            battery_voltage: 9.5, // Exceeds single-cell 18650 boundary
            is_simulated: false
        };
        assert.equal(TelemetryContract.validate(invalid), false);
    });
});