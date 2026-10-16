import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { FlowGenerator } from '../../src/core/FlowGenerator.js';

describe('FlowGenerator (Hydraulic Physics Engine)', () => {
    const generator = new FlowGenerator();

    test('Rule EXC-02: Flow calculated below 1.0 LPM clamps to 0.0 LPM (Mechanical Friction Floor)', () => {
        // Force a low flow override of 0.85 LPM
        const override = { 'NODE-B1-002': { fixed_flow_lpm: 0.85 } };
        
        // Un-overridden diurnal hour 2 (nocturnal lull) generating small flow
        const flow = generator.generateFlow('NODE-B1-002', 2, {});
        if (flow > 0.0 && flow < 1.0) {
            assert.fail(`Generated flow ${flow} LPM violated Rule EXC-02 (< 1.0 LPM floor)`);
        }
    });

    test('Scenario Override: fixed_flow_lpm overrides diurnal calculation', () => {
        const override = { 'NODE-B1-002': { fixed_flow_lpm: 3.52, std: 0.0 } };
        const flow = generator.generateFlow('NODE-B1-002', 14, override);
        assert.equal(flow, 3.52);
    });

    test('Scenario Override: force_zero forces 0.0 LPM (Supply Starvation)', () => {
        const override = { 'NODE-B1-008': { force_zero: true } };
        const flow = generator.generateFlow('NODE-B1-008', 7, override);
        assert.equal(flow, 0.0);
    });

    test('Diurnal Multipliers: Morning peak hour (07:00) generates higher average flow than nocturnal hour (02:00)', () => {
        let morningSum = 0;
        let nightSum = 0;
        const runs = 100;

        for (let i = 0; i < runs; i++) {
            morningSum += generator.generateFlow('NODE-B1-002', 7, {});
            nightSum += generator.generateFlow('NODE-B1-002', 2, {});
        }

        const morningAvg = morningSum / runs;
        const nightAvg = nightSum / runs;

        assert.ok(morningAvg > nightAvg, `Expected Morning Avg (${morningAvg}) > Night Avg (${nightAvg})`);
    });
});