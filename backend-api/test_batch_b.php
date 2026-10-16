<?php
declare(strict_types=1);

require_once __DIR__ . '/vendor/autoload.php';

echo "===============================================================\n";
echo " AQUILA BATCH B (OPERATIONAL & DECISION SUPPORT) AUDIT\n";
echo "===============================================================\n";

function runTest(string $name, string $url, string $method = 'GET', array $headers = [], ?string $body = null, int $expectedCode = 200): ?array {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    if ($body !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    if (!empty($headers)) curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    
    $res = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $passed = ($httpCode === $expectedCode);
    $icon = $passed ? "✅ [PASS]" : "❌ [FAIL]";
    echo sprintf("%-12s | HTTP %d (Expected %d) | %s\n", $icon, $httpCode, $expectedCode, $name);
    
    if (!$passed && $res) {
        echo "   ↳ Response: " . substr((string)$res, 0, 150) . "\n";
    }

    return json_decode((string)$res, true);
}

// 1. Login as Admin
$login = runTest('Admin Login', 'http://127.0.0.1/aquila-system/backend-api/public/api/v1/auth/login', 'POST', ['Content-Type: application/json'], json_encode(['email'=>'admin@bawasa.gov.ph', 'password'=>'Password123!']));
$adminToken = $login['data']['token'] ?? '';
$authHeader = ['Authorization: Bearer ' . $adminToken, 'Content-Type: application/json'];

// 2. Log Manual Citizen Complaint (POST /api/v1/incidents)
$manual = runTest('Manual Complaint Logging', 'http://127.0.0.1/aquila-system/backend-api/public/api/v1/incidents', 'POST', $authHeader, json_encode([
    'node_id'         => 'NODE-B1-004',
    'incident_type'   => 'CRITICAL_LEAK',
    'severity_level'  => 'P1',
    'complaint_notes' => 'Resident reported standing water near water meter box.'
]), 201);
$ticketId = $manual['data']['incident_id'] ?? '';

// 3. Inspect Incident Details + Audit Trail (GET /api/v1/incidents/{id})
runTest('Get Incident Details + Audit Trail', "http://127.0.0.1/aquila-system/backend-api/public/api/v1/incidents/{$ticketId}", 'GET', $authHeader);

// 4. Dispatch Technician ID 2
runTest('Dispatch Technician', "http://127.0.0.1/aquila-system/backend-api/public/api/v1/incidents/{$ticketId}/dispatch", 'POST', $authHeader, json_encode(['technician_id' => 2]));

// 5. Dismiss False Alarm / Cancellation (PATCH /api/v1/incidents/{id}/cancel)
runTest('Cancel Incident (False Alarm)', "http://127.0.0.1/aquila-system/backend-api/public/api/v1/incidents/{$ticketId}/cancel", 'PATCH', $authHeader, json_encode([
    'cancellation_reason' => 'Technician inspected site: surface water was from domestic garden hose.'
]));

// 6. Test 15-Minute Verification Evaluator on dynamically created ticket
$db = Aquila\Config\Database::getConnection();
$db->prepare("UPDATE INCIDENT_TICKET SET status = 'PENDING_VERIFICATION', pending_verification_since = NOW() WHERE incident_id = :id")
   ->execute([':id' => $ticketId]);

runTest('15-Min Quiescent Evaluator (Auto-Close)', "http://127.0.0.1/aquila-system/backend-api/public/api/v1/incidents/{$ticketId}/verify-flow", 'POST', $authHeader, json_encode([
    'current_flow_rate_lpm' => 0.02,
    'elapsed_seconds'       => 900
]));

echo "===============================================================\n";
echo " BATCH B AUDIT COMPLETE\n";
echo "===============================================================\n";
