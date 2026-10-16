import { create } from 'zustand';
import { THRESHOLDS } from '../config/thresholds';

// System operational thresholds matching .env and AppConfig.php
const STALE_TIMEOUT_SEC = THRESHOLDS.STALE_TELEMETRY_TIMEOUT_SECONDS;
const LOW_BATTERY_VOLTS = THRESHOLDS.LOW_BATTERY_THRESHOLD_VOLTS;
const HEARTBEAT_TIMEOUT_SEC = THRESHOLDS.CIRCUIT_BREAKER_TIMEOUT_SECONDS;
const MAX_HISTORY_POINTS = 20;

export const useTelemetryStore = create((set, get) => ({
  // 1. Core Reactive State
  isConnected: false,
  nodes: {},               // { [nodeId]: { status, telemetry: { flow_rate_lpm, cumulative_liters, battery_voltage, ... } } }
  leakHypotheses: {},      // { [nodeId]: { classification, leak_probability, flow_rate_lpm, duration_minutes, timestamp } }
  fairnessHypotheses: {},  // { [nodeId]: { rdi_score, delta_liters, is_disadvantaged, override_active, timestamp } }
  heartbeats: {},          // { [agentId]: { status, timestamp } }
  telemetryHistory: {},    // { [nodeId]: [{ timestamp, flow }] } rolling 20-point buffer for sparklines
  lastUpdated: null,

  // ---------------------------------------------------------------------------
  // 2. State Ingestion Actions (Called by rtdb_subscription.js)
  // ---------------------------------------------------------------------------

  setConnectionStatus: (isConnected) => set({ isConnected }),

  /**
   * Updates all nodes and appends fresh packets to the sparkline history buffer
   */
  setNodesData: (incomingNodes) => {
    const prevHistory = get().telemetryHistory;
    const updatedHistory = { ...prevHistory };

    Object.entries(incomingNodes).forEach(([nodeId, nodeData]) => {
      const telemetry = nodeData?.telemetry;
      if (!telemetry || typeof telemetry.flow_rate_lpm !== 'number') return;

      const currentFlow = telemetry.flow_rate_lpm;
      const packetTime = telemetry.timestamp || Math.floor(Date.now() / 1000);

      const nodeHistory = updatedHistory[nodeId] ? [...updatedHistory[nodeId]] : [];
      const lastEntry = nodeHistory[nodeHistory.length - 1];

      // Only append if this is a fresh packet sequence/timestamp
      if (!lastEntry || lastEntry.timestamp !== packetTime) {
        nodeHistory.push({ timestamp: packetTime, flow: currentFlow });
        if (nodeHistory.length > MAX_HISTORY_POINTS) {
          nodeHistory.shift();
        }
        updatedHistory[nodeId] = nodeHistory;
      }
    });

    set({
      nodes: incomingNodes,
      telemetryHistory: updatedHistory,
      lastUpdated: Date.now()
    });
  },

  /**
   * Updates a single node (used for Resident data isolation)
   */
  setSingleNodeData: (nodeId, nodeData) => {
    const prevNodes = get().nodes;
    const prevHistory = get().telemetryHistory;

    const telemetry = nodeData?.telemetry;
    const nodeHistory = prevHistory[nodeId] ? [...prevHistory[nodeId]] : [];

    if (telemetry && typeof telemetry.flow_rate_lpm === 'number') {
      const currentFlow = telemetry.flow_rate_lpm;
      const packetTime = telemetry.timestamp || Math.floor(Date.now() / 1000);
      const lastEntry = nodeHistory[nodeHistory.length - 1];

      if (!lastEntry || lastEntry.timestamp !== packetTime) {
        nodeHistory.push({ timestamp: packetTime, flow: currentFlow });
        if (nodeHistory.length > MAX_HISTORY_POINTS) nodeHistory.shift();
      }
    }

    set({
      nodes: { ...prevNodes, [nodeId]: nodeData },
      telemetryHistory: { ...prevHistory, [nodeId]: nodeHistory },
      lastUpdated: Date.now()
    });
  },

  setLeakHypotheses: (leakHypotheses) => set({ leakHypotheses }),

  setFairnessHypotheses: (fairnessHypotheses) => set({ fairnessHypotheses }),

  setHeartbeats: (heartbeats) => set({ heartbeats }),

  /**
   * Wipes hot store cache on user logout
   */
  resetTelemetryStore: () => set({
    isConnected: false,
    nodes: {},
    leakHypotheses: {},
    fairnessHypotheses: {},
    heartbeats: {},
    telemetryHistory: {},
    lastUpdated: null
  }),

  // ---------------------------------------------------------------------------
  // 3. Computed Selectors & System Health Evaluators
  // ---------------------------------------------------------------------------

  /**
   * Returns complete telemetry and AI state for a specific node
   */
  getNode: (nodeId) => {
    const state = get();
    const node = state.nodes[nodeId] || null;
    return {
      nodeId,
      status: node?.status || 'INACTIVE',
      telemetry: node?.telemetry || null,
      leak: state.leakHypotheses[nodeId] || null,
      fairness: state.fairnessHypotheses[nodeId] || null,
      history: state.telemetryHistory[nodeId] || []
    };
  },

  /**
   * Checks if node telemetry is stale (> 45s without fresh packet)
   */
  isNodeStale: (nodeId) => {
    const telemetry = get().nodes[nodeId]?.telemetry;
    if (!telemetry || !telemetry.timestamp) return true;
    const nowEpoch = Math.floor(Date.now() / 1000);
    return (nowEpoch - telemetry.timestamp) > STALE_TIMEOUT_SEC;
  },

  /**
   * Checks if battery potential is below low voltage threshold (3.35V)
   */
  isLowBattery: (nodeId) => {
    const telemetry = get().nodes[nodeId]?.telemetry;
    if (!telemetry || typeof telemetry.battery_voltage !== 'number') return false;
    return telemetry.battery_voltage < LOW_BATTERY_VOLTS;
  },

  /**
   * Evaluates overall MAS Multi-Agent System liveness (FR-DSS-03)
   * Checks pulse of LDA, FEA, and CA agents against the 30-second circuit breaker
   */
  getSystemHealth: () => {
    const heartbeats = get().heartbeats;
    const nowEpoch = Math.floor(Date.now() / 1000);
    const monitoredAgents = ['CMP-LDA-01', 'CMP-FEA-01', 'CMP-CA-01'];
    
    let healthyCount = 0;
    const degradedAgents = [];

    monitoredAgents.forEach((agentId) => {
      const pulse = heartbeats[agentId];
      if (pulse && pulse.timestamp && (nowEpoch - pulse.timestamp) <= HEARTBEAT_TIMEOUT_SEC && pulse.status === 'HEALTHY') {
        healthyCount++;
      } else {
        degradedAgents.push(agentId);
      }
    });

    return {
      isHealthy: degradedAgents.length === 0,
      healthyCount,
      totalCount: monitoredAgents.length,
      degradedAgents
    };
  }
}));