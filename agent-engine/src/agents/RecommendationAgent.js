/**
 * RecommendationAgent (CMP-RA-01)
 *
 * Implements non-actuating operational action cards under constraint INV-01.
 * Formulates simple, jargon-free, step-by-step instructions for human operators
 * and field plumbers based on Philippine BAWASA standard maintenance procedures.
 */
export class RecommendationAgent {
    /**
     * Generates an actionable operational advisory card.
     *
     * @param {'CRITICAL_LEAK' | 'FAIRNESS_DEFICIT' | 'SUSPICIOUS_USAGE' | string} incidentType
     * @param {string} nodeId - Target infrastructure node identifier.
     * @param {'P1' | 'P2' | 'P3' | string} [severity='P3'] - Priority tier.
     * @param {string|null} [locationName=null] - Physical street address or landmark from MONITORING_NODE.
     * @returns {{title: string, priority: string, action_directive: string}}
     */
    static generateActionCard(incidentType, nodeId, severity = 'P3', locationName = null) {
        const locationTag = locationName ? `${locationName} (${nodeId})` : nodeId;

        if (incidentType === 'CRITICAL_LEAK') {
            return {
                title: "Continuous Water Leak / Pipe Burst",
                priority: severity,
                action_directive: `Inspect the water line at ${locationTag}. Look for wet ground, puddles, or hissing sounds near the meter box and pipe joints. If a leak is confirmed, close the shutoff valve and patch or clamp the damaged pipe section.`
            };
        }

        if (incidentType === 'FAIRNESS_DEFICIT') {
            return {
                title: "Low Water Supply / Pressure Drop",
                priority: severity,
                action_directive: `Check water pressure at ${locationTag}. Household is receiving far less water than neighboring homes. Inspect the supply line for partial blockages, check if the upstream isolation valve is partially closed, or test for air locks in the pipe.`
            };
        }

        if (incidentType === 'SUSPICIOUS_USAGE') {
            return {
                title: "Unusual Continuous Water Draw",
                priority: severity,
                action_directive: `Continuous water flow detected at ${locationTag}. Check if the resident has an open garden hose, refilling tank, or leaking toilet flapper. Wait 15 minutes to verify if flow stops before sending a plumber on-site.`
            };
        }

        return {
            title: "Irregular Meter Reading",
            priority: severity,
            action_directive: `Inspect meter at ${locationTag} for unusual flow readings. Check if the meter is clogged by sediment or needs sensor calibration.`
        };
    }
}