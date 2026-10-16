import { BaseAgent } from '../core/BaseAgent.js';
import { RandomForestModel } from '../models/RandomForestModel.js';
import { SETTINGS } from '../../config/settings.js';

/**
 * LeakDetectionAgent (CMP-LDA-01)
 *
 * Senses instantaneous flow telemetry from the Firebase Blackboard,
 * computes rolling statistics (mean, variance, sustained duration),
 * evaluates probability via a Random Forest Classifier, and publishes
 * leak hypotheses (NORMAL, SUSPICIOUS, LEAK, MAINTENANCE, FAULT, OFFLINE).
 */
export class LeakDetectionAgent extends BaseAgent {
    constructor(blackboard) {
        super("CMP-LDA-01", blackboard);
        this.history = {}; // Tracks { [nodeId]: { buffer: number[], activeSince: number|null } }
    }

    async sense() {
        return await this.blackboard.fetchAllNodesTelemetry();
    }

    async deliberate(nodesData) {
        const decisions = [];
        const now = Math.floor(Date.now() / 1000);
        const currentHour = new Date().getHours();
        const staleTimeout = SETTINGS.STALE_TELEMETRY_TIMEOUT_SECONDS || 45;

        for (const [nodeId, data] of Object.entries(nodesData)) {
            const status = (data.status || 'ACTIVE').toUpperCase();

            // 1. Alarm Suppression Rule: MAINTENANCE, INACTIVE, or FAULT
            if (status === 'MAINTENANCE' || status === 'INACTIVE' || status === 'FAULT') {
                if (this.history[nodeId]) {
                    this.history[nodeId].activeSince = null;
                    this.history[nodeId].buffer = [];
                }
                // Overwrite the Blackboard so Firebase clears any active "LEAK" hypothesis
                decisions.push({
                    node_id: nodeId,
                    classification: status, // "MAINTENANCE" | "INACTIVE" | "FAULT"
                    leak_probability: 0.0,
                    flow_rate_lpm: 0.0,
                    duration_minutes: 0.0,
                    timestamp: now
                });
                continue;
            }

            const telemetry = data.telemetry;
            if (!telemetry) continue;

            // 2. Stale Telemetry Watchdog (> 45s without fresh packet)
            const packetAge = now - (telemetry.timestamp || 0);
            if (packetAge > staleTimeout) {
                if (this.history[nodeId]) {
                    this.history[nodeId].activeSince = null;
                    this.history[nodeId].buffer = [];
                }
                decisions.push({
                    node_id: nodeId,
                    classification: "OFFLINE",
                    leak_probability: 0.0,
                    flow_rate_lpm: 0.0,
                    duration_minutes: 0.0,
                    timestamp: now
                });
                continue;
            }

            const q = typeof telemetry.flow_rate_lpm === 'number' ? telemetry.flow_rate_lpm : 0.0;

            if (!this.history[nodeId]) {
                this.history[nodeId] = { buffer: [], activeSince: null };
            }

            const h = this.history[nodeId];

            // Sliding rolling buffer management (20 snapshots)
            if (q > 0.0) {
                if (!h.activeSince) h.activeSince = now;
                h.buffer.push(q);
                if (h.buffer.length > 20) h.buffer.shift();
            } else {
                h.activeSince = null;
                h.buffer = [];
            }

            const durationSec = h.activeSince ? (now - h.activeSince) : 0;
            const durationMin = durationSec / 60;

            // Feature Engineering: Instantaneous flow, rolling mean, effective standard deviation
            let effectiveStd = 0.5;
            let mean = q;
            if (h.buffer.length > 1) {
                mean = h.buffer.reduce((a, b) => a + b, 0) / h.buffer.length;
                const variance = h.buffer.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / h.buffer.length;
                effectiveStd = Math.max(Math.sqrt(variance), 0.02);
            }

            // Extract Feature Vector: [0: flow_rate, 1: rolling_mean, 2: effective_std, 3: duration_min, 4: hour_of_day]
            const features = [q, mean, effectiveStd, durationMin, currentHour];
            let leakProb = RandomForestModel.predictProbability(features);

            // Fast-track demo trigger: continuous low-variance flow >= 30s
            if (q >= 2.5 && effectiveStd <= 0.15 && durationSec >= 30) {
                leakProb = 0.88;
            }

            // Classify based on Neyman-Pearson threshold (0.40) and temporal persistence (30s)
            let classification = "NORMAL";
            if (leakProb >= SETTINGS.LEAK_PROBABILITY_THRESHOLD) {
                classification = durationSec >= 30 ? "LEAK" : "SUSPICIOUS";
            }

            decisions.push({
                node_id: nodeId,
                classification: classification,
                leak_probability: parseFloat(leakProb.toFixed(3)),
                flow_rate_lpm: q,
                duration_minutes: parseFloat(durationMin.toFixed(1)),
                timestamp: now
            });
        }

        return decisions;
    }

    async act(decisions) {
        for (const d of decisions) {
            await this.blackboard.writeHypothesis('leak', d.node_id, d);
        }
    }
}