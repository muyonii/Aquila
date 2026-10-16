/**
 * Formal Data Contract for 7-Field Ingestion Telemetry (DR-01)
 *
 * Enforces schema compliance, non-nullability, data types, and physical bounds
 * matching cloud-config/database.rules.json and edge-firmware/include/telemetry_payload.h.
 */
export class TelemetryContract {
    /**
     * Validates an incoming telemetry payload object.
     *
     * @param {any} payload
     * @returns {boolean} true if payload strictly satisfies all 7 contract rules.
     */
    static validate(payload) {
        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
            return false;
        }

        const requiredFields = [
            'node_id',
            'packet_sequence',
            'timestamp',
            'flow_rate_lpm',
            'cumulative_liters',
            'battery_voltage',
            'is_simulated'
        ];

        // 1. Structural check: All 7 required fields must exist and not be null/undefined
        const hasAllFields = requiredFields.every(
            field => field in payload && payload[field] !== null && payload[field] !== undefined
        );

        if (!hasAllFields) {
            return false;
        }

        // 2. Type & Boundary checks (matching Firebase rules & physical limits)
        if (typeof payload.node_id !== 'string' || payload.node_id.trim() === '') {
            return false;
        }

        if (typeof payload.packet_sequence !== 'number' || payload.packet_sequence < 0) {
            return false;
        }

        if (typeof payload.timestamp !== 'number' || payload.timestamp < 1600000000) {
            return false;
        }

        if (typeof payload.flow_rate_lpm !== 'number' || payload.flow_rate_lpm < 0.0 || payload.flow_rate_lpm > 45.0) {
            return false;
        }

        if (typeof payload.cumulative_liters !== 'number' || payload.cumulative_liters < 0.0) {
            return false;
        }

        if (typeof payload.battery_voltage !== 'number' || payload.battery_voltage < 0.0 || payload.battery_voltage > 6.0) {
            return false;
        }

        if (typeof payload.is_simulated !== 'boolean') {
            return false;
        }

        return true;
    }
}