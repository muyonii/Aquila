import { BaseAgent } from '../core/BaseAgent.js';
import { SETTINGS } from '../../config/settings.js';

/**
 * FairnessEvaluationAgent (CMP-FEA-01)
 *
 * Evaluates water distribution equity across households using the
 * Rawlsian Relative Deprivation Index (RDI = Delta_i / Mean_community).
 * Implements Rule BR-04 (0.70 Cutoff) and Rule BR-05 (Municipal Shortage Guard).
 */
export class FairnessEvaluationAgent extends BaseAgent {
    constructor(blackboard, windowSeconds = null) {
        super("CMP-FEA-01", blackboard);
        this.volumeHistory = {}; // Tracks { [nodeId]: [{ timestamp, liters }] }
        this.windowSeconds = windowSeconds || SETTINGS.FAIRNESS_WINDOW_SECONDS || 86400; // Default 24h
        this.minWarmupSeconds = 30; // Minimum 30s observation before firing alerts
    }

    async sense() {
        return await this.blackboard.fetchAllNodesTelemetry();
    }

    async deliberate(nodesData) {
        const now = Math.floor(Date.now() / 1000);
        const nodeDeltas = {};
        const nodeElapsed = {};
        let totalCommunityDelta = 0;
        let activeCount = 0;
        const staleTimeout = SETTINGS.STALE_TELEMETRY_TIMEOUT_SECONDS || 45;

        for (const [nodeId, data] of Object.entries(nodesData)) {
            const status = (data.status || 'ACTIVE').toUpperCase();

            // 1. Alarm Suppression: Purge historical buffer and ignore non-active nodes
            // Matches test specification (decisions array contains active nodes only)
            if (status !== 'ACTIVE') {
                delete this.volumeHistory[nodeId];
                continue;
            }

            const telemetry = data.telemetry;
            if (!telemetry || typeof telemetry.cumulative_liters !== 'number') {
                continue;
            }

            // 2. Stale Telemetry Watchdog (> 45s without fresh packet)
            const packetAge = now - (telemetry.timestamp || 0);
            if (packetAge > staleTimeout) {
                continue;
            }

            const currentLiters = telemetry.cumulative_liters;

            if (!this.volumeHistory[nodeId]) {
                this.volumeHistory[nodeId] = [];
            }

            const history = this.volumeHistory[nodeId];
            history.push({ timestamp: now, liters: currentLiters });

            // 3. Prune history older than the evaluation window (keep at least 1 baseline entry)
            while (history.length > 1 && (now - history[0].timestamp) > this.windowSeconds) {
                history.shift();
            }

            // Bound memory buffer to a maximum of 1,000 snapshots per node
            if (history.length > 1000) {
                const baseline = history[0];
                this.volumeHistory[nodeId] = [baseline, ...history.slice(-999)];
            }

            const baseline = this.volumeHistory[nodeId][0];
            const elapsed = Math.max(0, now - baseline.timestamp);
            const deltaLiters = Math.max(0.0, currentLiters - baseline.liters);

            nodeDeltas[nodeId] = deltaLiters;
            nodeElapsed[nodeId] = elapsed;
            totalCommunityDelta += deltaLiters;
            activeCount++;
        }

        if (activeCount === 0) {
            return [];
        }

        // 4. Determine community elapsed observation window & mean
        const communityMeanDelta = totalCommunityDelta / activeCount;
        const avgElapsedSeconds = Object.values(nodeElapsed).reduce((a, b) => a + b, 0) / activeCount;

        // 5. Warm-up Guard: Suppress alerts until baseline reaches minWarmupSeconds
        const isWarmingUp = avgElapsedSeconds < this.minWarmupSeconds;

        // 6. Time-Normalized 24-Hour Municipal Shortage Guard (Rule BR-05)
        // Project observed mean to equivalent 24-hour (86,400s) consumption rate
        const timeFactor = this.windowSeconds / Math.max(avgElapsedSeconds, 1);
        const projectedDailyLiters = communityMeanDelta * timeFactor;
        const shortageOverride = !isWarmingUp && 
            (projectedDailyLiters < SETTINGS.MUNICIPAL_SHORTAGE_FLOOR_LPD) && 
            (totalCommunityDelta > 0);

        const decisions = [];

        for (const [nodeId, delta] of Object.entries(nodeDeltas)) {
            // Rawlsian Relative Deprivation Index (RDI)
            const rdi = communityMeanDelta > 0 ? delta / (communityMeanDelta + 0.0001) : 1.0;
            const isDisadvantaged = !isWarmingUp && !shortageOverride && (rdi < SETTINGS.RDI_DISADVANTAGE_CUTOFF);

            decisions.push({
                node_id: nodeId,
                rdi_score: parseFloat(rdi.toFixed(3)),
                delta_liters: parseFloat(delta.toFixed(2)),
                community_mean_liters: parseFloat(communityMeanDelta.toFixed(2)),
                projected_daily_mean_liters: parseFloat(projectedDailyLiters.toFixed(2)),
                is_disadvantaged: isDisadvantaged,
                override_active: shortageOverride,
                is_warming_up: isWarmingUp,
                elapsed_seconds: Math.round(nodeElapsed[nodeId] || 0),
                timestamp: now
            });
        }

        return decisions;
    }

    async act(decisions) {
        for (const d of decisions) {
            await this.blackboard.writeHypothesis('fairness', d.node_id, d);
        }
    }
}