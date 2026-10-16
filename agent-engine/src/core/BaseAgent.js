import { IAgent } from '../contracts/IAgent.js';

/**
 * Abstract BaseAgent (Core OOP Tier)
 *
 * Implements the classic Template Method Pattern for the Sense-Deliberate-Act (SDA) loop.
 * Guarantees that every concrete agent (LDA, FEA, CA) posts liveness heartbeats
 * to the watchdog and guards against overlapping re-entrant execution cycles.
 */
export class BaseAgent {
    /**
     * @param {string} agentId - Canonical identifier (e.g. "CMP-LDA-01")
     * @param {Object} blackboardService - Shared Firebase Blackboard service
     */
    constructor(agentId, blackboardService) {
        if (new.target === BaseAgent) {
            throw new TypeError("Cannot construct Abstract BaseAgent directly. Subclass must extend it.");
        }

        this.agentId = agentId;
        this.blackboard = blackboardService;
        this.isRunning = false;
    }

    /**
     * Template Method Pattern: Orchestrates the sequential SDA lifecycle.
     */
    async executeCycle() {
        // Concurrency Guard: Prevents overlapping cycles if a previous tick is still awaiting I/O
        if (this.isRunning) {
            console.warn(`[${this.agentId}] Cycle already executing; skipping overlapping tick.`);
            return;
        }

        this.isRunning = true;

        try {
            // 1. SENSE: Gather environmental data from Blackboard
            const inputs = await this.sense();

            if (inputs !== null && inputs !== undefined) {
                // 2. DELIBERATE: Compute hypotheses or causal decisions
                const decision = await this.deliberate(inputs);

                if (decision !== null && decision !== undefined) {
                    // 3. ACT: Write to Blackboard or dispatch webhooks
                    await this.act(decision);
                }
            }

            // 4. HEARTBEAT: Report healthy liveness to the 30s watchdog circuit breaker
            await this.postHeartbeat("HEALTHY");

        } catch (error) {
            console.error(`[${this.agentId}] Cycle Execution Error:`, error.message);
            // Report degraded state to watchdog on failure
            await this.postHeartbeat("DEGRADED");
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Senses environmental state from the Blackboard.
     * @abstract
     * @returns {Promise<any>}
     */
    async sense() {
        throw new Error(`Method 'sense()' must be implemented by subclass ${this.constructor.name}.`);
    }

    /**
     * Processes sensed inputs through algorithmic or machine learning models.
     * @abstract
     * @param {any} inputs
     * @returns {Promise<any>}
     */
    async deliberate(inputs) {
        throw new Error(`Method 'deliberate()' must be implemented by subclass ${this.constructor.name}.`);
    }

    /**
     * Executes the deliberated action (writes hypothesis or dispatches webhook).
     * @abstract
     * @param {any} decision
     * @returns {Promise<void>}
     */
    async act(decision) {
        throw new Error(`Method 'act()' must be implemented by subclass ${this.constructor.name}.`);
    }

    /**
     * Updates agent heartbeat status in Firebase (/blackboard/heartbeats/{agentId})
     * @param {'HEALTHY' | 'DEGRADED'} status
     */
    async postHeartbeat(status = "HEALTHY") {
        if (this.blackboard && typeof this.blackboard.updateHeartbeat === 'function') {
            await this.blackboard.updateHeartbeat(this.agentId, status);
        }
    }
}