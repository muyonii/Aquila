import { SETTINGS } from '../../config/settings.js';
import { TOPOLOGY_NODES } from '../../config/topology_nodes.js';

/**
 * NodeStateManager
 * Tracks in-memory operational state for all 10 infrastructure nodes.
 */
export class NodeStateManager {
    constructor() {
        this.states = {};
        this.initStates();
    }

    initStates() {
        for (const node of TOPOLOGY_NODES) {
            this.states[node.node_id] = {
                node_id: node.node_id,
                household_label: node.household_label,
                location_name: node.location_name,
                purok_cluster: node.purok_cluster,
                parent_node_id: node.parent_node_id,
                is_physical: node.is_physical,
                status: 'ACTIVE',
                packet_sequence: 1,
                cumulative_liters: node.initial_volume_liters || 100.0,
                battery_voltage: SETTINGS.INITIAL_BATTERY_VOLTS || 4.20,
                last_flow_lpm: 0.0,
                last_updated: Math.floor(Date.now() / 1000)
            };
        }
    }

    isPhysicalHardware(nodeId) {
        return this.states[nodeId]?.is_physical === true;
    }

    updateTick(nodeId, flowRateLpm) {
        const state = this.states[nodeId];
        if (!state) return null;

        const now = Math.floor(Date.now() / 1000);

        // 1. Monotonic Odometer Volume Integration: V_k = V_{k-1} + (Q * 15/60)
        const deltaLiters = (flowRateLpm * 15) / 60;
        state.cumulative_liters = parseFloat((state.cumulative_liters + deltaLiters).toFixed(2));

        // 2. Increment Packet Sequence Counter
        state.packet_sequence += 1;

        // 3. Slowly decay battery voltage over time
        state.battery_voltage = parseFloat(Math.max(SETTINGS.LOW_BATTERY_WARNING_VOLTS, state.battery_voltage - 0.00002).toFixed(2));

        state.last_flow_lpm = flowRateLpm;
        state.last_updated = now;

        // 7-Field Telemetry Contract Payload (DR-01)
        return {
            node_id: state.node_id,
            packet_sequence: state.packet_sequence,
            timestamp: now,
            flow_rate_lpm: flowRateLpm,
            cumulative_liters: state.cumulative_liters,
            battery_voltage: state.battery_voltage,
            is_simulated: !state.is_physical
        };
    }

    setNodeStatus(nodeId, newStatus) {
        if (this.states[nodeId]) {
            this.states[nodeId].status = newStatus.toUpperCase();
        }
    }

    getAllStates() {
        return this.states;
    }
}