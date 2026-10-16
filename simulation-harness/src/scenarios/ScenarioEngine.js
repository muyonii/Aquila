import { SCENARIO_PRESETS } from './ScenarioPresets.js';

/**
 * ScenarioEngine
 * Manages self-latching scenario overrides and system restoration.
 */
export class ScenarioEngine {
    constructor() {
        this.activeScenarioKey = 'BASELINE_NORMAL';
        this.activeScenarioName = SCENARIO_PRESETS.BASELINE_NORMAL.name;
        this.latchedOverrides = {};
    }

    setScenario(key) {
        if (SCENARIO_PRESETS[key]) {
            this.activeScenarioKey = key;
            this.activeScenarioName = SCENARIO_PRESETS[key].name;
            this.latchedOverrides = JSON.parse(JSON.stringify(SCENARIO_PRESETS[key].overrides || {}));
            return true;
        }
        return false;
    }

    latchNodeOverride(nodeId, overrideObj) {
        this.latchedOverrides[nodeId] = {
            ...(this.latchedOverrides[nodeId] || {}),
            ...overrideObj
        };
    }

    unlatchNodeOverride(nodeId) {
        delete this.latchedOverrides[nodeId];
    }

    getOverrides() {
        return this.latchedOverrides;
    }

    resetToOriginalState() {
        this.activeScenarioKey = 'BASELINE_NORMAL';
        this.activeScenarioName = SCENARIO_PRESETS.BASELINE_NORMAL.name;
        this.latchedOverrides = {};
    }
}