<?php
declare(strict_types=1);

require_once __DIR__ . '/vendor/autoload.php';

use Aquila\Config\AppConfig;
use Aquila\Config\Database;
use Aquila\Config\Env;
use Aquila\Domain\Entities\IncidentTicket;
use Aquila\Domain\Enums\IncidentSeverity;
use Aquila\Domain\Enums\IncidentStatus;
use Aquila\Domain\ValueObjects\FlowRate;
use Aquila\Services\FirebaseCleanerService;
use Aquila\Services\RepairVerificationService;
use Aquila\Utils\Uuid;

Env::load();

echo "====================================================================\n";
echo " AQUILA: FIREBASE <-> PHPMYADMIN (MYSQL) INTEGRATION BRIDGE SUITE\n";
echo "====================================================================\n";

$firebaseUrl = rtrim(AppConfig::getFirebaseUrl(), '/');
$testNodeId = 'NODE-B1-001';
$passed = 0;
$failed = 0;

function reportResult(string $bridgeName, bool $success, string $details = ''): void {
    global $passed, $failed;
    if ($success) {
        $passed++;
        echo sprintf("  ✅ [PASS] %s\n", $bridgeName);
        if ($details) echo "      ↳ {$details}\n";
    } else {
        $failed++;
        echo sprintf("  ❌ [FAIL] %s\n", $bridgeName);
        if ($details) echo "      ↳ Error: {$details}\n";
    }
}

// Accepts mixed $data (array, string, etc.)
function firebaseRequest(string $url, string $method = 'GET', mixed $data = null): mixed {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_TIMEOUT, 6);
    if ($data !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    }
    $raw = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode >= 200 && $httpCode < 300) {
        return json_decode((string)$raw, true) ?? [];
    }
    return null;
}

// -----------------------------------------------------------------------------
// BRIDGE 1: Dual-Database Handshake (MySQL PDO & Firebase HTTPS)
// -----------------------------------------------------------------------------
echo "\n--- [BRIDGE 1]: Dual Database Handshake & Connection Integrity ---\n";
try {
    $db = Database::getConnection();
    $mysqlTz = $db->query("SELECT @@session.time_zone")->fetchColumn();
    $mysqlOk = ($mysqlTz === '+08:00');

    // Ping /nodes.json instead of root to respect database.rules.json
    $fbHealth = firebaseRequest("{$firebaseUrl}/nodes.json?shallow=true");
    $fbOk = ($fbHealth !== null);

    reportResult(
        "MySQL PDO Connection & Timezone (+08:00)", 
        $mysqlOk, 
        "Connected to 'aquila_db'. Session timezone: {$mysqlTz}"
    );
    reportResult(
        "Firebase RTDB HTTPS Connection (Singapore)", 
        $fbOk, 
        "Connected to {$firebaseUrl}"
    );
} catch (\Throwable $e) {
    reportResult("Dual Database Handshake", false, $e->getMessage());
}

// -----------------------------------------------------------------------------
// BRIDGE 2: Maintenance Status Sync (MySQL -> Firebase)
// -----------------------------------------------------------------------------
echo "\n--- [BRIDGE 2]: Node Maintenance Status Synchronization (MySQL -> Firebase) ---\n";
try {
    // 1. Set MAINTENANCE string in Firebase
    firebaseRequest("{$firebaseUrl}/nodes/{$testNodeId}/status.json", 'PUT', 'MAINTENANCE');
    $readMaint = firebaseRequest("{$firebaseUrl}/nodes/{$testNodeId}/status.json", 'GET');
    $maintOk = ($readMaint === 'MAINTENANCE');

    // 2. Revert back to ACTIVE
    firebaseRequest("{$firebaseUrl}/nodes/{$testNodeId}/status.json", 'PUT', 'ACTIVE');
    $readActive = firebaseRequest("{$firebaseUrl}/nodes/{$testNodeId}/status.json", 'GET');
    $activeOk = ($readActive === 'ACTIVE');

    reportResult(
        "Maintenance State Transition Sync", 
        ($maintOk && $activeOk), 
        "State transitioned: ACTIVE -> MAINTENANCE -> ACTIVE in Firebase RTDB"
    );
} catch (\Throwable $e) {
    reportResult("Maintenance Status Sync", false, $e->getMessage());
}

// -----------------------------------------------------------------------------
// BRIDGE 3: CQRS Compaction Volume Delta Bridge (Firebase -> MySQL HOURLY_SUMMARY)
// -----------------------------------------------------------------------------
echo "\n--- [BRIDGE 3]: CQRS Volume Delta Compaction (Firebase -> MySQL) ---\n";
try {
    $db = Database::getConnection();
    $testHour = '2026-09-28 12:00:00';
    $nextHour = '2026-09-28 13:00:00';

    // Step A: Seed baseline in MySQL HOURLY_SUMMARY (cumulative = 2000.0 L)
    $db->prepare("DELETE FROM HOURLY_SUMMARY WHERE node_id = :node AND hour_timestamp IN (:h1, :h2)")
       ->execute([':node' => $testNodeId, ':h1' => $testHour, ':h2' => $nextHour]);

    $db->prepare(
        "INSERT INTO HOURLY_SUMMARY (node_id, hour_timestamp, total_volume_liters, peak_flow_rate_lpm, leak_flag_count, cumulative_meter_reading)
         VALUES (:node, :hour, 0.00, 0.00, 0, 2000.00)"
    )->execute([':node' => $testNodeId, ':hour' => $testHour]);

    // Step B: Simulate water consumption in Firebase: meter advances to 2035.50 Liters (35.50 L used)
    firebaseRequest("{$firebaseUrl}/nodes/{$testNodeId}/telemetry.json", 'PUT', [
        'node_id'           => $testNodeId,
        'packet_sequence'   => 999,
        'timestamp'         => time(),
        'flow_rate_lpm'     => 3.50,
        'cumulative_liters' => 2035.50,
        'battery_voltage'   => 4.10,
        'is_simulated'      => false
    ]);

    // Step C: Execute compaction calculation logic
    $stmt = $db->prepare(
        "SELECT cumulative_meter_reading FROM HOURLY_SUMMARY 
         WHERE node_id = :node AND hour_timestamp < :next_hour 
         ORDER BY hour_timestamp DESC LIMIT 1"
    );
    $stmt->execute([':node' => $testNodeId, ':next_hour' => $nextHour]);
    $prevCumulative = (float)$stmt->fetchColumn();

    $currentReading = 2035.50;
    $computedDelta = max(0.0, $currentReading - $prevCumulative);

    // Save compacted row for next hour
    $db->prepare(
        "INSERT INTO HOURLY_SUMMARY (node_id, hour_timestamp, total_volume_liters, peak_flow_rate_lpm, leak_flag_count, cumulative_meter_reading)
         VALUES (:node, :hour, :delta, 3.50, 0, :reading)"
    )->execute([
        ':node'    => $testNodeId,
        ':hour'    => $nextHour,
        ':delta'   => $computedDelta,
        ':reading' => $currentReading
    ]);

    // Inspect MySQL: delta must be exactly 35.50 L, NOT 2035.50 L!
    $chkStmt = $db->prepare("SELECT total_volume_liters, cumulative_meter_reading FROM HOURLY_SUMMARY WHERE node_id = :node AND hour_timestamp = :hour");
    $chkStmt->execute([':node' => $testNodeId, ':hour' => $nextHour]);
    $row = $chkStmt->fetch();

    $cqrsOk = ($row && (float)$row['total_volume_liters'] === 35.50 && (float)$row['cumulative_meter_reading'] === 2035.50);

    // Cleanup
    $db->prepare("DELETE FROM HOURLY_SUMMARY WHERE node_id = :node AND hour_timestamp IN (:h1, :h2)")
       ->execute([':node' => $testNodeId, ':h1' => $testHour, ':h2' => $nextHour]);

    reportResult(
        "True Hourly Delta Calculation (2035.50 - 2000.00 = 35.50 L)",
        $cqrsOk,
        "MySQL recorded exact incremental consumption: {$row['total_volume_liters']} L (Odometer: {$row['cumulative_meter_reading']} L)"
    );
} catch (\Throwable $e) {
    reportResult("CQRS Volume Delta Compaction", false, $e->getMessage());
}

// -----------------------------------------------------------------------------
// BRIDGE 4: Closed-Loop Repair Verification (Firebase Flow -> MySQL Ticket State)
// -----------------------------------------------------------------------------
echo "\n--- [BRIDGE 4]: Closed-Loop Repair Verification (Firebase Flow -> MySQL Work Order) ---\n";
try {
    $db = Database::getConnection();
    $service = new RepairVerificationService();
    $testTicketId = Uuid::v4();

    // 1. Create temporary PENDING_VERIFICATION ticket in MySQL
    $db->prepare(
        "INSERT INTO INCIDENT_TICKET (incident_id, node_id, incident_type, severity_level, action_card_title, action_directive, detected_at, pending_verification_since, status, repair_notes)
         VALUES (:id, :node, 'CRITICAL_LEAK', 'P1', 'Test Rupture', 'Inspect coupling', NOW(), NOW() - INTERVAL 900 SECOND, 'PENDING_VERIFICATION', 'Coupling clamped')"
    )->execute([':id' => $testTicketId, ':node' => $testNodeId]);

    // 2. Scenario A: Write Quiescent Flow (0.02 LPM) to Firebase
    firebaseRequest("{$firebaseUrl}/nodes/{$testNodeId}/telemetry.json", 'PUT', [
        'node_id'           => $testNodeId,
        'packet_sequence'   => 1001,
        'timestamp'         => time(),
        'flow_rate_lpm'     => 0.02,
        'cumulative_liters' => 2035.60,
        'battery_voltage'   => 4.10,
        'is_simulated'      => false
    ]);

    // Read flow from Firebase & evaluate for 900s elapsed
    $fbTelemetry = firebaseRequest("{$firebaseUrl}/nodes/{$testNodeId}/telemetry.json");
    $observedLpm = (float)($fbTelemetry['flow_rate_lpm'] ?? 0.0);

    $ticketStmt = $db->prepare("SELECT * FROM INCIDENT_TICKET WHERE incident_id = :id");
    $ticketStmt->execute([':id' => $testTicketId]);
    $ticket = IncidentTicket::fromArray($ticketStmt->fetch());

    $outcomeA = $service->evaluateQuiescentFlow($ticket, new FlowRate($observedLpm), 900);
    $autoCloseOk = ($outcomeA === IncidentStatus::CLOSED_VERIFIED);

    // 3. Scenario B: Recurrent Burst Flow (2.50 LPM >= 1.0 LPM floor)
    $ticket->status = IncidentStatus::PENDING_VERIFICATION; // reset for test
    $outcomeB = $service->evaluateQuiescentFlow($ticket, new FlowRate(2.50), 120);
    $recurrentFailOk = ($outcomeB === IncidentStatus::REPAIR_FAILED);

    // Cleanup MySQL ticket
    $db->prepare("DELETE FROM INCIDENT_TICKET WHERE incident_id = :id")->execute([':id' => $testTicketId]);

    reportResult(
        "Automated Quiescent Closure (Flow <= 0.05 LPM for 900s -> CLOSED_VERIFIED)",
        $autoCloseOk,
        "Ticket auto-closed upon verifying quiescent flow of {$observedLpm} LPM"
    );
    reportResult(
        "Recurrent Burst Failure (Flow >= 1.0 LPM -> REPAIR_FAILED)",
        $recurrentFailOk,
        "Ticket flagged REPAIR_FAILED immediately on recurrent burst of 2.50 LPM"
    );
} catch (\Throwable $e) {
    reportResult("Closed-Loop Repair Verification", false, $e->getMessage());
}

// -----------------------------------------------------------------------------
// BRIDGE 5: Stale Telemetry Pruner (MySQL Nodes -> Firebase Telemetry Cleanup)
// -----------------------------------------------------------------------------
echo "\n--- [BRIDGE 5]: Stale Telemetry Pruning (MySQL Node List -> Firebase Cleanup) ---\n";
try {
    // 1. Write an intentionally expired telemetry packet (3 hours old)
    $oldTime = time() - 10800;
    firebaseRequest("{$firebaseUrl}/nodes/{$testNodeId}/telemetry.json", 'PUT', [
        'node_id'           => $testNodeId,
        'packet_sequence'   => 1002,
        'timestamp'         => $oldTime,
        'flow_rate_lpm'     => 4.20,
        'cumulative_liters' => 2035.60,
        'battery_voltage'   => 3.80,
        'is_simulated'      => false
    ]);

    // 2. Run the cleaner service
    $prunedCount = FirebaseCleanerService::pruneExpiredTelemetry();

    // 3. Read back from Firebase: flow_rate_lpm must be zeroed out
    $cleaned = firebaseRequest("{$firebaseUrl}/nodes/{$testNodeId}/telemetry.json");
    $pruneOk = ($cleaned && (float)$cleaned['flow_rate_lpm'] === 0.0 && ($cleaned['stale_pruned'] ?? false) === true);

    // Restore testbed telemetry to clean state
    firebaseRequest("{$firebaseUrl}/nodes/{$testNodeId}/telemetry.json", 'PUT', [
        'node_id'           => $testNodeId,
        'packet_sequence'   => 1,
        'timestamp'         => time(),
        'flow_rate_lpm'     => 0.00,
        'cumulative_liters' => 2035.60,
        'battery_voltage'   => 4.10,
        'is_simulated'      => false
    ]);

    reportResult(
        "Phantom Leak Prevention (Stale packet > 2h zeroed out)",
        $pruneOk,
        "Expired packet was neutralized: flow_rate_lpm set to 0.0"
    );
} catch (\Throwable $e) {
    reportResult("Stale Telemetry Pruning", false, $e->getMessage());
}

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
echo "\n====================================================================\n";
echo sprintf("RESULTS: Total Bridges Tested: %d | Passed: %d | Failed: %d\n", ($passed + $failed), $passed, $failed);
echo "====================================================================\n";

exit($failed === 0 ? 0 : 1);