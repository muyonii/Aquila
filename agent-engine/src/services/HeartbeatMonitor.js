import { SETTINGS } from '../../config/settings.js';

/**
 * Heartbeat & Liveness Watchdog Service (FR-DSS-03)
 *
 * Continuously monitors agent execution timestamps in the Firebase Blackboard.
 * If any analytical or coordination agent (LDA, FEA, CA) fails to publish a heartbeat
 * within the 30-second circuit breaker threshold, it flags the system as DEGRADED.
 */
export class HeartbeatMonitor {
    /**
     * @param {Object} blackboardService - Shared Firebase Blackboard service
     * @param {number} [timeoutThresholdSec=30.0] - Circuit breaker tripping threshold
     */
    constructor(blackboardService, timeoutThresholdSec = SETTINGS.CIRCUIT_BREAKER_TIMEOUT_SEC || 30.0) {
        this.blackboard = blackboardService;
        this.timeoutThreshold = timeoutThresholdSec;
        this.agentStatuses = {};
        this.monitoredAgents = ['CMP-LDA-01', 'CMP-FEA-01', 'CMP-CA-01'];
    }

    /**
     * Evaluates the operational liveness of all agents.
     *
     * @returns {Promise<{systemHealthy: boolean, degradedAgents: string[], statuses: Object, timestamp: number}>}
     */
    async checkLiveness() {
        const now = Math.floor(Date.now() / 1000);
        let heartbeats = {};

        try {
            const res = await this.blackboard._request('/blackboard/heartbeats.json');
            heartbeats = res || {};
        } catch (error) {
            console.error('[HeartbeatMonitor] Failed fetching heartbeats from Firebase:', error.message);
            return {
                systemHealthy: false,
                degradedAgents: ['ALL_OFFLINE_FIREBASE_UNREACHABLE'],
                statuses: {},
                timestamp: now
            };
        }

        const degraded = [];

        for (const agentId of this.monitoredAgents) {
            const pulse = heartbeats[agentId];

            if (!pulse || !pulse.timestamp) {
                this.agentStatuses[agentId] = 'UNREGISTERED';
                degraded.push(agentId);
                continue;
            }

            const elapsed = now - pulse.timestamp;

            if (elapsed > this.timeoutThreshold) {
                this.agentStatuses[agentId] = 'DEGRADED';
                degraded.push(agentId);
                console.warn(`⚠️ [HeartbeatMonitor] Agent ${agentId} is DEGRADED! (No pulse for ${elapsed}s > ${this.timeoutThreshold}s)`);
            } else {
                this.agentStatuses[agentId] = 'HEALTHY';
            }
        }

        const systemHealthy = degraded.length === 0;

        return {
            systemHealthy,
            degradedAgents: degraded,
            statuses: this.agentStatuses,
            timestamp: now
        };
    }

    /**
     * Checks if a specific agent is healthy
     * @param {string} agentId
     */
    isAgentHealthy(agentId) {
        return this.agentStatuses[agentId] === 'HEALTHY';
    }
}