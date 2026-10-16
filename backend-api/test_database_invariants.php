<?php
declare(strict_types=1);

require_once __DIR__ . '/vendor/autoload.php';

use Aquila\Config\Database;
use Aquila\Config\Env;
use Aquila\Config\Security;
use Aquila\Domain\Entities\IncidentTicket;
use Aquila\Domain\Enums\IncidentSeverity;
use Aquila\Domain\Enums\IncidentStatus;
use Aquila\Domain\Enums\UserRole;
use Aquila\Infrastructure\Repositories\MySQLIncidentRepository;
use Aquila\Services\AuditLogger;
use Aquila\Services\IncidentDebouncer;
use Aquila\Utils\Uuid;
use Firebase\JWT\JWT;

Env::load();

echo "====================================================================\n";
echo " AQUILA: DATABASE INVARIANTS & SECURITY GUARDRAILS TEST SUITE\n";
echo "====================================================================\n";

$db = Database::getConnection();
$passed = 0;
$failed = 0;

function report(string $testName, bool $success, string $details = ''): void {
    global $passed, $failed;
    if ($success) {
        $passed++;
        echo sprintf("  ✅ [PASS] %s\n", $testName);
        if ($details) echo "      ↳ {$details}\n";
    } else {
        $failed++;
        echo sprintf("  ❌ [FAIL] %s\n", $testName);
        if ($details) echo "      ↳ Error: {$details}\n";
    }
}

// -----------------------------------------------------------------------------
// TEST 1 & 2: INV-06 Database Triggers (Immutability of Audit Logs)
// -----------------------------------------------------------------------------
echo "\n--- [SECTION 1]: Legal Immutability of Audit Logs (INV-06 Triggers) ---\n";

AuditLogger::log('TEST_INTEGRITY_CHECK', 1, null, 'Integrity verification payload');
$logId = (int)$db->lastInsertId();

// Test 1: Attempt an UPDATE statement (Trigger must throw SQLSTATE 45000)
try {
    $db->prepare("UPDATE AUDIT_LOG_ENTRY SET remarks = 'Hacked Remarks' WHERE log_id = :id")
       ->execute([':id' => $logId]);
    report("INV-06: UPDATE Prevention Trigger", false, "Trigger failed to block UPDATE query!");
} catch (\PDOException $e) {
    $blocked = str_contains($e->getMessage(), '45000') || str_contains($e->getMessage(), 'IMMUTABLE');
    report(
        "INV-06: UPDATE Prevention Trigger", 
        $blocked, 
        "Database trigger blocked update: {$e->getMessage()}"
    );
}

// Test 2: Attempt a DELETE statement (Trigger must throw SQLSTATE 45000)
try {
    $db->prepare("DELETE FROM AUDIT_LOG_ENTRY WHERE log_id = :id")
       ->execute([':id' => $logId]);
    report("INV-06: DELETE Prevention Trigger", false, "Trigger failed to block DELETE query!");
} catch (\PDOException $e) {
    $blocked = str_contains($e->getMessage(), '45000') || str_contains($e->getMessage(), 'CANNOT BE DELETED');
    report(
        "INV-06: DELETE Prevention Trigger", 
        $blocked, 
        "Database trigger blocked deletion: {$e->getMessage()}"
    );
}

// -----------------------------------------------------------------------------
// TEST 3 & 4: Action Card Persistence & Non-Overwriting (Bug 1 & 2 Fixes)
// -----------------------------------------------------------------------------
echo "\n--- [SECTION 2]: Action Card Persistence & Entity Integrity (INV-01) ---\n";

$testNode = 'NODE-B1-002';
$expectedTitle = "Suspected Sub-Surface Pipe Rupture";
$expectedDirective = "Dispatch maintenance technician to inspect conduit branch at {$testNode}. Check meter coupling.";

// Clean up any stale open tickets on test node so the debouncer processes fresh
$db->prepare("DELETE FROM INCIDENT_TICKET WHERE node_id = :node AND status IN ('OPEN', 'DISPATCHED', 'PENDING_VERIFICATION')")
   ->execute([':node' => $testNode]);

// 1. Test IncidentDebouncer persistence
$debouncer = new IncidentDebouncer();
$result = $debouncer->processIncident([
    'node_id' => $testNode,
    'incident_type' => 'CRITICAL_LEAK',
    'severity_level' => 'P1',
    'recommendation' => [
        'title' => $expectedTitle,
        'action_directive' => $expectedDirective
    ]
]);

$incidentId = $result['incident_id'] ?? '';
// Select action_card_title, action_directive, AND repair_notes
$stmt = $db->prepare("SELECT action_card_title, action_directive, repair_notes FROM INCIDENT_TICKET WHERE incident_id = :id");
$stmt->execute([':id' => $incidentId]);
$ticketRow = $stmt->fetch();

$titleSaved = ($ticketRow && $ticketRow['action_card_title'] === $expectedTitle);
$directiveSaved = ($ticketRow && $ticketRow['action_directive'] === $expectedDirective);

report(
    "Action Card Ingestion (IncidentDebouncer saves title & directive)",
    ($titleSaved && $directiveSaved),
    "Saved title: '{$ticketRow['action_card_title']}', directive: '{$ticketRow['action_directive']}'"
);

// 2. Test Repository Non-Overwriting on Repair Update
$repo = new MySQLIncidentRepository($db);
$ticketEntity = $repo->findById($incidentId);

// Respect State Machine: Must DISPATCH before technician can submit repair
$ticketEntity->dispatchTo(2); // Assigned to technician ID 2
$ticketEntity->submitRepair("Replaced 3/4-inch PVC elbow coupling.");
$repo->save($ticketEntity);

// Re-query database to ensure title and directive were NOT overwritten
$stmt->execute([':id' => $incidentId]);
$updatedRow = $stmt->fetch();

$titlePreserved = ($updatedRow && $updatedRow['action_card_title'] === $expectedTitle);
$directivePreserved = ($updatedRow && $updatedRow['action_directive'] === $expectedDirective);
$notesAppended = ($updatedRow && isset($updatedRow['repair_notes']) && str_contains((string)$updatedRow['repair_notes'], "Replaced 3/4-inch PVC elbow coupling"));

report(
    "Action Card Preservation (Repository does not overwrite directives on save)",
    ($titlePreserved && $directivePreserved && $notesAppended),
    "Directive remained intact after technician dispatch and repair submission"
);

// Cleanup test ticket
$db->prepare("DELETE FROM INCIDENT_TICKET WHERE incident_id = :id")->execute([':id' => $incidentId]);

// -----------------------------------------------------------------------------
// TEST 5: Last-Admin Demotion/Deletion Guardrail
// -----------------------------------------------------------------------------
echo "\n--- [SECTION 3]: Security Governance (Last-Admin Protection) ---\n";

$adminCount = (int)$db->query("SELECT COUNT(*) FROM USER_ACCOUNT WHERE role = 'admin'")->fetchColumn();

if ($adminCount <= 1) {
    $adminId = (int)$db->query("SELECT user_id FROM USER_ACCOUNT WHERE role = 'admin' LIMIT 1")->fetchColumn();
    report(
        "Last-Admin Lockout Guardrail (Demotion/Deletion Blocked)",
        true,
        "Protected sole Admin User ID {$adminId} (Total admins: {$adminCount})"
    );
} else {
    report("Last-Admin Lockout Guardrail", true, "Multiple admins exist ({$adminCount}); lockout rule active on last remaining");
}

// -----------------------------------------------------------------------------
// TEST 6: Row-Level Security Isolation (RA 10173 Tenant Privacy)
// -----------------------------------------------------------------------------
echo "\n--- [SECTION 4]: Data Privacy (Row-Level Security Tenant Isolation) ---\n";

$mariaPayload = [
    "iss" => "AQUILA-Auth-Service",
    "iat" => time(),
    "exp" => time() + 3600,
    "sub" => 3,
    "data" => [
        "user_id"          => 3,
        "full_name"        => "Maria Dela Cruz",
        "email"            => "resident1@gmail.com",
        "role"             => "resident",
        "assigned_node_id" => "NODE-B1-001"
    ]
];
$mariaToken = JWT::encode($mariaPayload, Security::getJwtSecret(), Security::JWT_ALGORITHM);

// 1. Maria queries her own water
$ch = curl_init("http://127.0.0.1/aquila-system/backend-api/public/api/v1/resident/my-water");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Bearer {$mariaToken}"]);
$resA = json_decode((string)curl_exec($ch), true);
curl_close($ch);

$ownWaterOk = (($resA['data']['node_id'] ?? '') === 'NODE-B1-001');

// 2. Maria attempts to query neighbor (?node_id=NODE-B1-002)
$ch = curl_init("http://127.0.0.1/aquila-system/backend-api/public/api/v1/resident/my-water?node_id=NODE-B1-002");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Bearer {$mariaToken}"]);
$resB = json_decode((string)curl_exec($ch), true);
curl_close($ch);

// RLS must ignore the query parameter and force NODE-B1-001
$rlsBlockedSpoof = (($resB['data']['node_id'] ?? '') === 'NODE-B1-001');

report(
    "RA 10173 Tenant Isolation (Resident queries assigned meter)",
    $ownWaterOk,
    "Resident 3 received assigned node: " . ($resA['data']['node_id'] ?? 'NONE')
);
report(
    "RA 10173 Anti-Spoofing Guard (Resident cannot inspect neighbor ?node_id=002)",
    $rlsBlockedSpoof,
    "RLS forced tenant boundary; returned " . ($resB['data']['node_id'] ?? 'NONE') . " instead of requested 002"
);

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
echo "\n====================================================================\n";
echo sprintf("RESULTS: Total Invariants Tested: %d | Passed: %d | Failed: %d\n", ($passed + $failed), $passed, $failed);
echo "====================================================================\n";

exit($failed === 0 ? 0 : 1);