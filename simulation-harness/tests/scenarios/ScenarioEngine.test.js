import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ScenarioEngine } from '../../src/scenarios/ScenarioEngine.js';

describe('ScenarioEngine (Demonstration Preset Manager)', () => {

    test('Default scenario is BASELINE_NORMAL with empty overrides', () => {
        const engine = new ScenarioEngine();
        assert.equal(engine.activeScenarioKey, 'BASELINE_NORMAL');
        assert.deepEqual(engine.getOverrides(), {});
    });

    test('Switches to CRITICAL_LEAK and applies 3.52 LPM override to NODE-B1-002', () => {
        const engine = new ScenarioEngine();
        const ok = engine.setScenario('CRITICAL_LEAK');

        assert.equal(ok, true);
        assert.equal(engine.activeScenarioKey, 'CRITICAL_LEAK');
        
        const overrides = engine.getOverrides();
        assert.ok(overrides['NODE-B1-002']);
        assert.equal(overrides['NODE-B1-002'].fixed_flow_lpm, 3.52);
    });

    test('Switches to CASCADE_BR06 and applies leak to parent 002 and zero flow to child 004', () => {
        const engine = new ScenarioEngine();
        engine.setScenario('CASCADE_BR06');

        const overrides = engine.getOverrides();
        assert.equal(overrides['NODE-B1-002'].fixed_flow_lpm, 3.52);
        assert.equal(overrides['NODE-B1-004'].force_zero, true);
    });

    test('Resets cleanly back to BASELINE_NORMAL', () => {
        const engine = new ScenarioEngine();
        engine.setScenario('DROUGHT_BR05');
        assert.equal(engine.activeScenarioKey, 'DROUGHT_BR05');

        engine.reset();
        assert.equal(engine.activeScenarioKey, 'BASELINE_NORMAL');
        assert.deepEqual(engine.getOverrides(), {});
    });
});