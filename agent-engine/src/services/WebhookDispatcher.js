import crypto from 'crypto';
import { SETTINGS } from '../../config/settings.js';

export class WebhookDispatcher {
    constructor(webhookUrl = SETTINGS.BACKEND_WEBHOOK_URL, secretKey = SETTINGS.WEBHOOK_SECRET) {
        this.webhookUrl = webhookUrl;
        this.secretKey = secretKey;
        this.timeoutMs = SETTINGS.NETWORK_TIMEOUT_MS || 5000;
    }

    async dispatchIncident(incidentPayload) {
        const timestamp = Math.floor(Date.now() / 1000);
        const eventBody = JSON.stringify({
            event_type: 'INCIDENT_DETECTED',
            timestamp: timestamp,
            payload: incidentPayload
        });

        const signature = crypto
            .createHmac('sha256', this.secretKey)
            .update(`${timestamp}.${eventBody}`)
            .digest('hex');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

        try {
            console.log(`[WebhookDispatcher] Pushing ${incidentPayload.incident_type} (${incidentPayload.severity_level}) for ${incidentPayload.node_id}...`);

            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Aquila-Timestamp': timestamp.toString(),
                    'X-Aquila-Signature': signature
                },
                body: eventBody,
                signal: controller.signal
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[WebhookDispatcher] HTTP ${response.status} Error:`, errorText);
                return null;
            }

            const json = await response.json();
            console.log(`✔ [WebhookDispatcher] Backend Response: ${json.data?.action} -> ${json.data?.message || 'OK'}`);
            return json;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.error(`[WebhookDispatcher] Dispatch timed out after ${this.timeoutMs}ms`);
            } else {
                console.error(`[WebhookDispatcher] POST failed:`, error.message);
            }
            return null;
        } finally {
            clearTimeout(timeoutId);
        }
    }
}