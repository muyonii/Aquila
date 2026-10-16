import { BaseAgent } from '../core/BaseAgent.js';
import { RecommendationAgent } from './RecommendationAgent.js';
import { SETTINGS } from '../../config/settings.js';

/**
 * CoordinatorAgent (CMP-CA-01)
 *
 * Central multi-agent arbiter and topological graph coordinator.
 * Responsibilities:
 *  1. Synchronizes the hydraulic Directed Acyclic Graph (DAG) hierarchy from MySQL.
 *  2. Traverses parentage trees to isolate root causes and suppress induced downstream alarms (BR-06).
 *  3. Formulates structured incident payloads with non-actuating action cards (INV-01).
 *  4. Dispatches HMAC-SHA256 authenticated webhooks to the PHP transactional core.
 */
export class CoordinatorAgent extends BaseAgent {
    /**
     * @param {Object} blackboard - BlackboardService instance interacting with Firebase RTDB.
     * @param {Object} webhookDispatcher - WebhookDispatcher instance for transactional API calls.
     */
    constructor(blackboard, webhookDispatcher) {
        super("CMP-CA-01", blackboard);
        this.dispatcher = webhookDispatcher;
        
        /** @type {Object.<string, string>} childNodeId -> parentNodeId */
        this.dagMap = {};
        /** @type {Object.<string, Object>} nodeId -> metadata { location_name, household_label } */
        this.nodeMetadata = {};
        this.lastDagSync = 0;
        this.dagSyncTtlMs = 60000; // 60-second caching to prevent REST endpoint thrashing
        this.hasDegradedTopology = false;

        /**
         * Cold-start fallback topology used strictly if the REST API is unreachable on initial boot.
         */
        this.defaultBootstrapDag = {
            'NODE-B1-002': 'NODE-B1-001',
            'NODE-B1-003': 'NODE-B1-001',
            'NODE-B1-004': 'NODE-B1-002',
            'NODE-B1-005': 'NODE-B1-002',
            'NODE-B1-008': 'NODE-B1-004',
            'NODE-B1-009': 'NODE-B1-004',
            'NODE-B1-010': 'NODE-B1-005'
        };
    }

    /**
     * Synchronizes pipeline hierarchy and node metadata from the MySQL REST API.
     * Parses explicit PIPELINE_DAG_EDGE records with graceful fallback to node.parent_node_id.
     *
     * @returns {Promise<void>}
     */
    async syncDagHierarchy() {
        const now = Date.now();
        const hasExistingCache = Object.keys(this.dagMap).length > 0;

        // Skip remote fetch if local cache is still warm
        if (now - this.lastDagSync < this.dagSyncTtlMs && hasExistingCache) {
            return;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), SETTINGS.NETWORK_TIMEOUT_MS || 5000);

            const res = await fetch(SETTINGS.NODE_API_URL, {
                headers: {
                    'Accept': 'application/json',
                    'X-Aquila-Internal-Key': SETTINGS.WEBHOOK_SECRET
                },
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!res.ok) {
                throw new Error(`HTTP ${res.status} returned by Node Topology API`);
            }

            const payload = await res.json();
            if (payload && payload.success && payload.data) {
                const freshMap = {};
                const freshMetadata = {};

                // 1. Cache node metadata (location names and labels)
                if (Array.isArray(payload.data.nodes)) {
                    for (const node of payload.data.nodes) {
                        freshMetadata[node.node_id] = {
                            location_name: node.location_name || null,
                            household_label: node.household_label || null
                        };

                        // Fallback parent reference
                        if (node.parent_node_id) {
                            freshMap[node.node_id] = node.parent_node_id;
                        }
                    }
                }

                // 2. Primary: Parse explicit PIPELINE_DAG_EDGE relations if present
                if (Array.isArray(payload.data.edges) && payload.data.edges.length > 0) {
                    for (const edge of payload.data.edges) {
                        if (edge.upstream_node_id && edge.downstream_node_id) {
                            freshMap[edge.downstream_node_id] = edge.upstream_node_id;
                        }
                    }
                }

                this.dagMap = freshMap;
                this.nodeMetadata = freshMetadata;
                this.lastDagSync = now;
                this.hasDegradedTopology = false;
            } else {
                throw new Error('Malformed or empty payload received from Node Topology API');
            }
        } catch (err) {
            this.hasDegradedTopology = true;

            // Defensive Design: Retain existing cache if available rather than reverting to stub
            if (hasExistingCache) {
                console.warn(`⚠️ [Coordinator] Topology sync failed: ${err.message}. Retaining ${Object.keys(this.dagMap).length} cached relations.`);
            } else {
                console.warn(`⚠️ [Coordinator] Cold boot topology fetch failed: ${err.message}. Loading default bootstrap topology.`);
                this.dagMap = { ...this.defaultBootstrapDag };
            }
        }
    }

    /**
     * Traverses the network hierarchy upwards to detect any leaking ancestor conduit.
     * Implements a cycle-defense Set to prevent infinite loops on looped hydraulic manifolds.
     *
     * @param {string} nodeId - Target node being evaluated.
     * @param {Object} leakHypotheses - Map of active leak hypotheses from the Blackboard.
     * @returns {string|null} Leaking parent node ID, or null if no ancestor is leaking.
     */
    findUpstreamLeak(nodeId, leakHypotheses) {
        const visited = new Set();
        let currentParent = this.dagMap[nodeId];

        while (currentParent) {
            // Defend against infinite loops caused by circular topology references
            if (visited.has(currentParent)) {
                console.error(`⚠️ [Coordinator] Cycle detected in DAG at node ${currentParent}. Terminating search.`);
                break;
            }
            visited.add(currentParent);

            if (leakHypotheses[currentParent]?.classification === 'LEAK') {
                return currentParent;
            }
            currentParent = this.dagMap[currentParent];
        }

        return null;
    }

    /**
     * Sensing Step (SDA Pattern): Pulls fresh hypotheses from Firebase Blackboard.
     *
     * @returns {Promise<{leakHypotheses: Object, fairnessHypotheses: Object}>}
     */
    async sense() {
        await this.syncDagHierarchy();
        const leakHypotheses = await this.blackboard.fetchHypotheses('leak');
        const fairnessHypotheses = await this.blackboard.fetchHypotheses('fairness');
        return { leakHypotheses, fairnessHypotheses };
    }

    /**
     * Deliberation Step (SDA Pattern): Arbitrates causal conflicts and maps incidents.
     *
     * @param {Object} inputs - Sensed hypotheses from Blackboard.
     * @returns {Promise<Array<Object>>} Actionable incident list.
     */
    async deliberate({ leakHypotheses, fairnessHypotheses }) {
        const incidents = [];

        // 1. Process P1 Critical Leaks and P3 Suspicious Usage Anomalies
        for (const [nodeId, leak] of Object.entries(leakHypotheses)) {
            const locName = this.nodeMetadata[nodeId]?.location_name || null;

            if (leak.classification === 'LEAK') {
                // Confirmed sustained pipe rupture (P1 Priority)
                incidents.push({
                    node_id: nodeId,
                    incident_type: 'CRITICAL_LEAK',
                    severity_level: 'P1',
                    recommendation: RecommendationAgent.generateActionCard('CRITICAL_LEAK', nodeId, 'P1', locName)
                });
            } else if (leak.classification === 'SUSPICIOUS') {
                // Early-stage, high-probability flow anomaly not yet sustained for 30s (P3 Priority)
                incidents.push({
                    node_id: nodeId,
                    incident_type: 'SUSPICIOUS_USAGE',
                    severity_level: 'P3',
                    recommendation: RecommendationAgent.generateActionCard('SUSPICIOUS_USAGE', nodeId, 'P3', locName)
                });
            }
        }

        // 2. Process P2 Fairness with Causal Upstream & Self-Rupture Suppression (Rule BR-06)
        for (const [nodeId, fair] of Object.entries(fairnessHypotheses)) {
            if (fair.is_disadvantaged) {
                const locName = this.nodeMetadata[nodeId]?.location_name || null;

                // Rule 2A: Self-Rupture check — If node itself is leaking, deficit is self-induced
                if (leakHypotheses[nodeId]?.classification === 'LEAK') {
                    console.log(`[Coordinator] Deficit on ${nodeId} is self-induced by its OWN critical leak. Suppressing fairness alarm.`);
                    continue;
                }

                // Rule 2B: Ancestor check — Deficit induced by an upstream pipe rupture (BR-06)
                const leakingParent = this.findUpstreamLeak(nodeId, leakHypotheses);
                if (leakingParent) {
                    console.log(`[Coordinator] Deficit on ${nodeId} is INDUCED by upstream leak on ${leakingParent}. Suppressing downstream alarm (BR-06).`);
                } else {
                    incidents.push({
                        node_id: nodeId,
                        incident_type: 'FAIRNESS_DEFICIT',
                        severity_level: 'P2',
                        recommendation: RecommendationAgent.generateActionCard('FAIRNESS_DEFICIT', nodeId, 'P2', locName)
                    });
                }
            }
        }

        return incidents;
    }

    /**
     * Acting Step (SDA Pattern): Dispatches incidents via HMAC-SHA256 authenticated webhooks.
     *
     * @param {Array<Object>} incidents - List of deliberated incidents.
     * @returns {Promise<void>}
     */
    async act(incidents) {
        for (const incident of incidents) {
            await this.dispatcher.dispatchIncident(incident);
        }
    }

    /**
     * Executes cycle and updates heartbeat status reflecting topological health.
     *
     * @override
     * @returns {Promise<void>}
     */
    async executeCycle() {
        try {
            const inputs = await this.sense();
            if (inputs) {
                const decision = await this.deliberate(inputs);
                if (decision && decision.length > 0) {
                    await this.act(decision);
                }
            }
            // Report DEGRADED to watchdog if topology sync failed but local cache is sustaining operations
            const status = this.hasDegradedTopology ? "DEGRADED" : "HEALTHY";
            await this.postHeartbeat(status);
        } catch (error) {
            console.error(`[${this.agentId}] Cycle Execution Error:`, error.message);
            await this.postHeartbeat("DEGRADED");
        }
    }
}