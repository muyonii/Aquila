<?php
declare(strict_types=1);

namespace Aquila\Controllers;

use Aquila\Middleware\WebhookSignatureMiddleware;
use Aquila\Services\IncidentDebouncer;

class WebhookController
{
    public function handleIncident(): void
    {
        header('Content-Type: application/json');

        // 1. Enforce HMAC-SHA256 Signature verification
        $rawPayload = WebhookSignatureMiddleware::verify();
        $event = json_decode($rawPayload, true);

        if (!$event || !isset($event['payload'])) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "error" => ["code" => "MALFORMED_EVENT", "message" => "Invalid event payload structure."]
            ]);
            return;
        }

        // 2. Delegate to the Debouncer Service
        $debouncer = new IncidentDebouncer();
        $result = $debouncer->processIncident($event['payload']);

        // 3. Return 200 OK
        http_response_code(200);
        echo json_encode([
            "success" => true,
            "data" => $result
        ], JSON_PRETTY_PRINT);
    }
}