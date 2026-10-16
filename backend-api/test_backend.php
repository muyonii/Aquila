<?php
declare(strict_types=1);

require_once __DIR__ . '/vendor/autoload.php';

echo "===============================================================\n";
echo " AQUILA BACKEND API COMPREHENSIVE VERIFICATION SUITE\n";
echo "===============================================================\n";

function testApi(string $name, string $url, string $method = 'GET', array $headers = [], ?string $body = null, int $expectedCode = 200): ?array {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    if ($body !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }
    if (!empty($headers)) {
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    }
    
    $res = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $passed = ($httpCode === $expectedCode);
    $icon = $passed ? "✅ [PASS]" : "❌ [FAIL]";
    echo sprintf("%-12s | HTTP %d (Expected %d) | %s\n", $icon, $httpCode, $expectedCode, $name);
    
    if (!$passed && $res) {
        echo "   ↳ Response: " . substr($res, 0, 150) . "\n";
    }

    return json_decode((string)$res, true);
}

// 1. Database Connection
try {
    $db = Aquila\Config\Database::getConnection();
    echo "✅ [PASS]     | MySQL 8.0 Connection Established (aquila_db)\n";
} catch (Exception $e) {
    echo "❌ [FAIL]     | Database Connection Failed: " . $e->getMessage() . "\n";
}

// 2. Health Endpoint
testApi('Health Check Endpoint', 'http://127.0.0.1/aquila-system/backend-api/public/');

// 3. Admin Authentication
$login = testApi(
    'Admin Login (JWT Issuance)', 
    'http://127.0.0.1/aquila-system/backend-api/public/api/v1/auth/login', 
    'POST', 
    ['Content-Type: application/json'], 
    json_encode(['email' => 'admin@bawasa.gov.ph', 'password' => 'Password123!'])
);
$adminToken = $login['data']['token'] ?? '';

// 4. Technician Authentication
$techLogin = testApi(
    'Technician Login (JWT Issuance)', 
    'http://127.0.0.1/aquila-system/backend-api/public/api/v1/auth/login', 
    'POST', 
    ['Content-Type: application/json'], 
    json_encode(['email' => 'technician@bawasa.gov.ph', 'password' => 'Password123!'])
);
$techToken = $techLogin['data']['token'] ?? '';

// 5. Resident Authentication
$resLogin = testApi(
    'Resident Login (JWT Issuance)', 
    'http://127.0.0.1/aquila-system/backend-api/public/api/v1/auth/login', 
    'POST', 
    ['Content-Type: application/json'], 
    json_encode(['email' => 'resident1@gmail.com', 'password' => 'Password123!'])
);
$resToken = $resLogin['data']['token'] ?? '';

use Aquila\Config\Env;
use Aquila\Config\Security;

Env::load();

// 6. HMAC Webhook Ingestion (Positive Authenticated Test)
$time = time();
$webhookPayload = json_encode([
    'event_type' => 'INCIDENT_DETECTED',
    'timestamp' => $time,
    'payload' => [
        'node_id' => 'NODE-B1-003',
        'incident_type' => 'CRITICAL_LEAK',
        'severity_level' => 'P1',
        'recommendation' => ['action_directive' => 'Check valve at Node 03']
    ]
]);

$secret = Security::getWebhookSecret();
$sig = hash_hmac('sha256', $time . '.' . $webhookPayload, $secret);

testApi(
    'HMAC Webhook Ingestion: Valid Signature (Node 03)', 
    'http://127.0.0.1/aquila-system/backend-api/public/api/v1/webhooks/incident', 
    'POST', 
    [
        'Content-Type: application/json', 
        'X-Aquila-Timestamp: ' . $time, 
        'X-Aquila-Signature: ' . $sig
    ], 
    $webhookPayload
);

// 6b. HMAC Webhook Ingestion: Tampered Signature Security Test (Must be HTTP 403)
testApi(
    'Security Guard: Forged HMAC Webhook Signature Rejection', 
    'http://127.0.0.1/aquila-system/backend-api/public/api/v1/webhooks/incident', 
    'POST', 
    [
        'Content-Type: application/json', 
        'X-Aquila-Timestamp: ' . $time, 
        'X-Aquila-Signature: ' . 'forged_deadbeef_signature_000000000000'
    ], 
    $webhookPayload,
    403
);

// 6c. HMAC Webhook Ingestion: Expired Timestamp Replay Attack (Must be HTTP 401)
$staleTime = time() - 600; // 10 minutes ago (> 300s replay tolerance)
$staleSig = hash_hmac('sha256', $staleTime . '.' . $webhookPayload, $secret);

testApi(
    'Security Guard: Replay Attack Expired Timestamp Rejection', 
    'http://127.0.0.1/aquila-system/backend-api/public/api/v1/webhooks/incident', 
    'POST', 
    [
        'Content-Type: application/json', 
        'X-Aquila-Timestamp: ' . $staleTime, 
        'X-Aquila-Signature: ' . $staleSig
    ], 
    $webhookPayload,
    401
);

// 7. Admin List Incidents
testApi(
    'Admin List Incidents (Bearer JWT)', 
    'http://127.0.0.1/aquila-system/backend-api/public/api/v1/incidents', 
    'GET', 
    ['Authorization: Bearer ' . $adminToken]
);

// 8. Technician Task Queue
testApi(
    'Technician Task Queue (Bearer JWT)', 
    'http://127.0.0.1/aquila-system/backend-api/public/api/v1/tasks', 
    'GET', 
    ['Authorization: Bearer ' . $techToken]
);

// 9. Resident Row-Level Security
testApi(
    'Resident Awareness RLS (/my-water)', 
    'http://127.0.0.1/aquila-system/backend-api/public/api/v1/resident/my-water', 
    'GET', 
    ['Authorization: Bearer ' . $resToken]
);

// 10. Cluster Analytics Summary
testApi(
    'Cluster Analytics KPI Summary', 
    'http://127.0.0.1/aquila-system/backend-api/public/api/v1/analytics/summary', 
    'GET', 
    ['Authorization: Bearer ' . $adminToken]
);

// 11. Security Negative Test: Unauthorized Request without Token (Should be HTTP 401)
testApi(
    'Security Guard: Missing Token Rejection', 
    'http://127.0.0.1/aquila-system/backend-api/public/api/v1/incidents', 
    'GET', 
    [], 
    null, 
    401
);

echo "===============================================================\n";
echo " BACKEND AUDIT COMPLETE\n";
echo "===============================================================\n";
