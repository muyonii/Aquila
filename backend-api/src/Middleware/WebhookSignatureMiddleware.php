<?php
declare(strict_types=1);

namespace Aquila\Middleware;

use Aquila\Config\Security;

class WebhookSignatureMiddleware
{
    public static function verify(): ?string
    {
        // 1. Inspect server environment and Apache rewritten headers
        $timestamp = $_SERVER['HTTP_X_AQUILA_TIMESTAMP'] 
            ?? $_SERVER['REDIRECT_HTTP_X_AQUILA_TIMESTAMP'] 
            ?? $_SERVER['REDIRECT_REDIRECT_HTTP_X_AQUILA_TIMESTAMP']
            ?? '';

        $signature = $_SERVER['HTTP_X_AQUILA_SIGNATURE'] 
            ?? $_SERVER['REDIRECT_HTTP_X_AQUILA_SIGNATURE'] 
            ?? $_SERVER['REDIRECT_REDIRECT_HTTP_X_AQUILA_SIGNATURE']
            ?? '';

        // 2. Fallback to header inspection via getallheaders / apache_request_headers
        if (empty($timestamp) || empty($signature)) {
            $headers = function_exists('getallheaders') 
                ? getallheaders() 
                : (function_exists('apache_request_headers') ? apache_request_headers() : []);

            foreach ($headers as $k => $v) {
                $lowerKey = strtolower((string)$k);
                if ($lowerKey === 'x-aquila-timestamp') $timestamp = (string)$v;
                if ($lowerKey === 'x-aquila-signature') $signature = (string)$v;
            }
        }

        $rawPayload = file_get_contents('php://input');

        // 3. Reject missing headers
        if (empty($timestamp) || empty($signature)) {
            http_response_code(401);
            header('Content-Type: application/json');
            echo json_encode([
                "success" => false,
                "error" => ["code" => "UNAUTHORIZED", "message" => "Missing webhook signature or timestamp headers."]
            ], JSON_PRETTY_PRINT);
            exit;
        }

        // 4. Replay attack protection (5-minute tolerance window)
        if (abs(time() - (int)$timestamp) > 300) {
            http_response_code(401);
            header('Content-Type: application/json');
            echo json_encode([
                "success" => false,
                "error" => ["code" => "TIMESTAMP_EXPIRED", "message" => "Webhook timestamp is stale or out of bounds."]
            ], JSON_PRETTY_PRINT);
            exit;
        }

        // 5. Verify cryptographic HMAC-SHA256 signature
        $expectedSignature = hash_hmac('sha256', $timestamp . '.' . $rawPayload, Security::getWebhookSecret());

        if (!hash_equals($expectedSignature, $signature)) {
            http_response_code(403);
            header('Content-Type: application/json');
            echo json_encode([
                "success" => false,
                "error" => ["code" => "INVALID_SIGNATURE", "message" => "Cryptographic signature verification failed."]
            ], JSON_PRETTY_PRINT);
            exit;
        }

        return $rawPayload;
    }
}