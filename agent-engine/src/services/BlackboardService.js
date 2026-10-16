import { SETTINGS } from '../../config/settings.js';

/**
 * BlackboardService
 *
 * Provides a resilient HTTP bridge to the Firebase Realtime Database Hot Store.
 * Encapsulates read/write operations for nodes, hypotheses, DAG edges, and heartbeats
 * with AbortController timeout budgets to prevent agent cycle stalls.
 */
export class BlackboardService {
    /**
     * @param {string} databaseUrl - Base Firebase RTDB endpoint
     */
    constructor(databaseUrl = SETTINGS.FIREBASE_DB_URL) {
        this.dbUrl = databaseUrl.replace(/\/+$/, '');
        this.timeoutMs = SETTINGS.NETWORK_TIMEOUT_MS || 5000;
    }

    /**
     * Internal helper to execute HTTP requests with strict timeout bounds
     * @private
     */
    async _request(endpoint, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

        try {
            const url = `${this.dbUrl}${endpoint}`;
            const res = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...(options.headers || {})
                },
                signal: controller.signal
            });

            if (!res.ok) {
                throw new Error(`Firebase HTTP ${res.status} on ${endpoint}`);
            }

            return await res.json();
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error(`Firebase request timed out after ${this.timeoutMs}ms on ${endpoint}`);
            }
            throw error;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    /**
     * Senses all nodes telemetry from Firebase (/nodes.json)
     * @returns {Promise<Object>} Map of nodeId -> node data
     */
    async fetchAllNodesTelemetry() {
        try {
            const data = await this._request('/nodes.json');
            return data || {};
        } catch (error) {
            console.error('[BlackboardService] Failed fetching nodes telemetry:', error.message);
            return {};
        }
    }

    /**
     * Writes an analytical hypothesis produced by LDA or FEA
     * @param {'leak' | 'fairness'} type
     * @param {string} nodeId
     * @param {Object} data
     */
    async writeHypothesis(type, nodeId, data) {
        try {
            await this._request(`/blackboard/hypotheses/${type}/${nodeId}.json`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        } catch (error) {
            console.error(`[BlackboardService] Failed writing ${type} hypothesis for ${nodeId}:`, error.message);
        }
    }

    /**
     * Senses active hypotheses of a specific category from the Blackboard
     * @param {'leak' | 'fairness'} type
     * @returns {Promise<Object>} Map of nodeId -> hypothesis
     */
    async fetchHypotheses(type) {
        try {
            const data = await this._request(`/blackboard/hypotheses/${type}.json`);
            return data || {};
        } catch (error) {
            console.error(`[BlackboardService] Failed fetching ${type} hypotheses:`, error.message);
            return {};
        }
    }

    /**
     * Fetches DAG edge relationships from Firebase (/dag/edges.json)
     * @returns {Promise<Object>}
     */
    async fetchDagEdges() {
        try {
            const data = await this._request('/dag/edges.json');
            return data || {};
        } catch (error) {
            return {};
        }
    }

    /**
     * Emits agent liveness heartbeat to the watchdog workspace
     * @param {string} agentId - e.g. "CMP-LDA-01"
     * @param {'HEALTHY' | 'DEGRADED'} status
     */
    async updateHeartbeat(agentId, status = 'HEALTHY') {
        try {
            await this._request(`/blackboard/heartbeats/${agentId}.json`, {
                method: 'PUT',
                body: JSON.stringify({
                    agent_id: agentId,
                    status: status,
                    timestamp: Math.floor(Date.now() / 1000)
                })
            });
        } catch (error) {
            console.error(`[BlackboardService] Failed updating heartbeat for ${agentId}:`, error.message);
        }
    }
}