import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SETTINGS } from '../../config/settings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * FlowGenerator
 * Physics-informed fluid dynamics engine. Calculates instantaneous flow velocity (LPM)
 * combining diurnal demand profiles, domestic turbulence, and scenario overrides.
 */
export class FlowGenerator {
    constructor() {
        this.profiles = this._loadProfiles();
    }

    _loadProfiles() {
        try {
            const profilePath = path.resolve(__dirname, '../../config/synthetic_profiles.json');
            if (fs.existsSync(profilePath)) {
                return JSON.parse(fs.readFileSync(profilePath, 'utf8'));
            }
        } catch (e) {
            console.warn('[FlowGenerator] Could not load synthetic_profiles.json, using built-in defaults.');
        }

        return {
            diurnal_schedule: {
                nocturnal: { hours: [0, 1, 2, 3, 4], active_draw_probability: 0.05, flow_min_lpm: 0.5, flow_max_lpm: 2.0 },
                morning_peak: { hours: [5, 6, 7, 8], active_draw_probability: 0.70, flow_min_lpm: 3.0, flow_max_lpm: 7.5 },
                midday_lull: { hours: [9, 10, 11, 12, 13, 14, 15, 16], active_draw_probability: 0.25, flow_min_lpm: 1.5, flow_max_lpm: 4.5 },
                evening_peak: { hours: [17, 18, 19, 20, 21], active_draw_probability: 0.60, flow_min_lpm: 2.5, flow_max_lpm: 6.0 },
                late_evening: { hours: [22, 23], active_draw_probability: 0.15, flow_min_lpm: 1.0, flow_max_lpm: 3.0 }
            }
        };
    }

    _randomGaussian(mean = 0, std = 1) {
        const u1 = Math.max(Math.random(), 1e-10);
        const u2 = Math.random();
        const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        return mean + z0 * std;
    }

    generateFlow(nodeId, hour, scenarioOverride = {}) {
        // 1. Check for specific node scenario overrides
        if (scenarioOverride[nodeId]) {
            const override = scenarioOverride[nodeId];

            if (typeof override.fixed_flow_lpm === 'number') {
                const noise = override.std ? this._randomGaussian(0, override.std) : 0;
                const flow = Math.max(0.0, override.fixed_flow_lpm + noise);
                return parseFloat(flow.toFixed(2));
            }

            if (override.force_zero) {
                return 0.0;
            }
        }

        // 2. Normal Diurnal Consumption Calculation
        let currentProfile = this.profiles.diurnal_schedule?.midday_lull;
        for (const p of Object.values(this.profiles.diurnal_schedule || {})) {
            if (Array.isArray(p.hours) && p.hours.includes(hour)) {
                currentProfile = p;
                break;
            }
        }

        const isActive = Math.random() < (currentProfile?.active_draw_probability ?? 0.30);
        if (!isActive) {
            return 0.0;
        }

        const minF = currentProfile?.flow_min_lpm ?? 1.5;
        const maxF = currentProfile?.flow_max_lpm ?? 4.5;
        const baseFlow = minF + Math.random() * (maxF - minF);
        const turbulence = this._randomGaussian(0, 0.45);
        let calculatedFlow = Math.max(0.0, baseFlow + turbulence);

        // 3. Rule EXC-02: Turbine Impeller Friction Floor (< 1.0 LPM)
        if (calculatedFlow < (SETTINGS.MECHANICAL_SENSOR_FLOOR_LPM || 1.0)) {
            return 0.0;
        }

        return parseFloat(calculatedFlow.toFixed(2));
    }
}