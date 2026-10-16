/**
 * Formal Interface Contract for Autonomous Agents (IAgent)
 *
 * Verifies at runtime that any analytical or coordination agent
 * strictly provides the four mandatory methods required by the engine.
 */
export class IAgent {
    /**
     * Validates that an agent instance satisfies the IAgent contract.
     *
     * @param {Object} agentInstance
     * @throws {TypeError} if any required method is missing
     */
    static validate(agentInstance) {
        if (!agentInstance || typeof agentInstance !== 'object') {
            throw new TypeError("IAgent contract validation requires an active class instance.");
        }

        const requiredMethods = ['sense', 'deliberate', 'act', 'executeCycle'];

        for (const method of requiredMethods) {
            if (typeof agentInstance[method] !== 'function') {
                throw new TypeError(
                    `Class ${agentInstance.constructor.name} violates IAgent contract: Missing '${method}()' implementation.`
                );
            }
        }

        return true;
    }
}