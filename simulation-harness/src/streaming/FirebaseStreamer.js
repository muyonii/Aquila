import { SETTINGS } from '../../config/settings.js';

/**
 * FirebaseStreamer
 * Publishes 7-field telemetry payloads (DR-01) and node metadata to Firebase RTDB over HTTP.
 */
export class FirebaseStreamer {
    constructor(dbUrl = SETTINGS.FIREBASE_DB_URL) {
        this.dbUrl = dbUrl.replace(/\/+$/, '');
        this.timeoutMs = SETTINGS.NETWORK_TIMEOUT_MS || 5000;
    }

    async initNodeMetadata(nodeState) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

        try {
            await fetch(`${this.dbUrl}/nodes/${nodeState.node_id}/status.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nodeState.status),
                signal: controller.signal
            });

            await fetch(`${this.dbUrl}/nodes/${nodeState.node_id}/metadata.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    household_label: nodeState.household_label,
                    location_name: nodeState.location_name,
                    purok_cluster: nodeState.purok_cluster,
                    is_physical: nodeState.is_physical
                }),
                signal: controller.signal
            });
        } catch (error) {
            // Ignore transient network glitches during metadata init
        } finally {
            clearTimeout(timeoutId);
        }
    }

    async streamTelemetry(nodeId, telemetryPayload) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

        try {
            const url = `${this.dbUrl}/nodes/${nodeId}/telemetry.json`;
            const res = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(telemetryPayload),
                signal: controller.signal
            });

            return res.ok;
        } catch (error) {
            return false;
        } finally {
            clearTimeout(timeoutId);
        }
    }
}