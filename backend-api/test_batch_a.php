<?php
declare(strict_types=1);

require_once __DIR__ . '/vendor/autoload.php';

echo "===============================================================\n";
echo " AQUILA BATCH A (ADMINISTRATIVE CORE) VERIFICATION SUITE\n";
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

// 2. Session Restore (/auth/me)
runTest('Session Restore (/auth/me)', 'http://127.0.0.1/aquila-system/backend-api/public/api/v1/auth/me', 'GET', $authHeader);

// 3. Create a New Plumber (Carlos Plumber)
$newPlumber = runTest('Create User: Technician', 'http://127.0.0.1/aquila-system/backend-api/public/api/v1/users', 'POST', $authHeader, json_encode([
    'full_name' => 'Carlos Plumber',
    'email'     => 'carlos.plumber@bawasa.gov.ph',
    'password'  => 'PlumberPass2026!',
    'role'      => 'technician'
]), 201);
$carlosId = (int)($newPlumber['data']['user_id'] ?? 0);

// 4. Query Users Filtered by Role (?role=technician)
runTest('List Users (?role=technician)', 'http://127.0.0.1/aquila-system/backend-api/public/api/v1/users?role=technician', 'GET', $authHeader);

// 5. Last-Admin Lockout Guard: Try demoting the ONLY Admin (User ID = 1) -> Must fail with 409
runTest('Security Guard: Last-Admin Demotion Rejection', 'http://127.0.0.1/aquila-system/backend-api/public/api/v1/users/1', 'PUT', $authHeader, json_encode([
    'role' => 'technician'
]), 409);

// 6. Node Update: Toggle Maintenance Mode on Node 02
runTest('Node Update: Set MAINTENANCE Mode', 'http://127.0.0.1/aquila-system/backend-api/public/api/v1/nodes/NODE-B1-002', 'PUT', $authHeader, json_encode([
    'status' => 'MAINTENANCE'
]));

// 7. Node Update: Restore Node 02 to ACTIVE
runTest('Node Update: Restore ACTIVE Status', 'http://127.0.0.1/aquila-system/backend-api/public/api/v1/nodes/NODE-B1-002', 'PUT', $authHeader, json_encode([
    'status' => 'ACTIVE'
]));

// 8. Delete Carlos Plumber
if ($carlosId > 0) {
    runTest('Delete User: Clean Cleanup', "http://127.0.0.1/aquila-system/backend-api/public/api/v1/users/{$carlosId}", 'DELETE', $authHeader);
}

echo "===============================================================\n";
echo " BATCH A AUDIT COMPLETE\n";
echo "===============================================================\n";
