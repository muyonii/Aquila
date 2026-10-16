<?php
declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use Aquila\Config\AppConfig;
use Aquila\Config\Database;
use Aquila\Config\Env;
use Aquila\Services\FirebaseCleanerService;

// 1. Ensure Environment & Timezone are strictly initialized in CLI mode
Env::load();
date_default_timezone_set(AppConfig::TIMEZONE);

$db = Database::getConnection();
$firebaseUrl = rtrim(AppConfig::getFirebaseUrl(), '/');

// Static hour boundary (e.g., 2026-10-15 14:00:00)
$currentHourTimestamp = date('Y-m-d H:00:00');

echo "[" . date('Y-m-d H:i:s') . "] Starting AQUILA CQRS Compaction Worker...\n";
echo "  ↳ Target Hour Window : {$currentHourTimestamp}\n";
echo "  ↳ Target Firebase URL: {$firebaseUrl}\n";

// Helper: Resilient cURL GET request
function fetchFirebaseData(string $url): ?array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 5,
        CURLOPT_SSL_VERIFYPEER => false // Resilient on local development / XAMPP
    ]);
    $raw = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode >= 200 && $httpCode < 300 && $raw) {
        return json_decode((string)$raw, true) ?? null;
    }
    return null;
}

// 2. Fetch all registered active monitoring nodes from MySQL
$nodesStmt = $db->query("SELECT node_id, is_physical FROM MONITORING_NODE WHERE status = 'ACTIVE'");
$activeNodes = $nodesStmt->fetchAll(PDO::FETCH_ASSOC);

$compactedCount = 0;

foreach ($activeNodes as $node) {
    $nodeId = $node['node_id'];

    // 3. Fetch live telemetry snapshot from Firebase RTDB Hot Store
    $telemetry = fetchFirebaseData("{$firebaseUrl}/nodes/{$nodeId}/telemetry.json");
    if (!$telemetry || !isset($telemetry['cumulative_liters'])) {
        continue;
    }

    $currentCumulativeLiters = (float)($telemetry['cumulative_liters'] ?? 0.0);
    $observedFlowRate        = (float)($telemetry['flow_rate_lpm'] ?? 0.0);

    // 4. Fetch the most recent historical baseline prior to this hour window
    $prevStmt = $db->prepare(
        "SELECT cumulative_meter_reading 
         FROM HOURLY_SUMMARY 
         WHERE node_id = :node_id AND hour_timestamp < :current_hour 
         ORDER BY hour_timestamp DESC 
         LIMIT 1"
    );
    $prevStmt->execute([
        ':node_id'      => $nodeId, 
        ':current_hour' => $currentHourTimestamp
    ]);
    $prevCumulative = $prevStmt->fetchColumn();

    // 5. Compute true incremental delta volume consumed during this hour
    if ($prevCumulative !== false) {
        $prevVal = (float)$prevCumulative;
        // Check for odometer reset or meter replacement
        $hourlyDeltaVolume = ($currentCumulativeLiters >= $prevVal) 
            ? ($currentCumulativeLiters - $prevVal) 
            : $currentCumulativeLiters;
    } else {
        // Cold-start baseline established
        $hourlyDeltaVolume = 0.0;
    }

    // 6. Count verified leaks flagged within this 1-hour window
    $leakCountStmt = $db->prepare(
        "SELECT COUNT(*) FROM INCIDENT_TICKET 
         WHERE node_id = :node_id 
           AND incident_type = 'CRITICAL_LEAK' 
           AND detected_at >= :current_hour - INTERVAL 1 HOUR 
           AND detected_at < :current_hour"
    );
    $leakCountStmt->execute([
        ':node_id'      => $nodeId,
        ':current_hour' => $currentHourTimestamp
    ]);
    $leakFlags = (int)$leakCountStmt->fetchColumn();

    // 7. Idempotent Upsert into HOURLY_SUMMARY (preserves peak flow and updates volume)
    $upsertStmt = $db->prepare(
        "INSERT INTO HOURLY_SUMMARY (
             node_id, 
             hour_timestamp, 
             total_volume_liters, 
             peak_flow_rate_lpm, 
             leak_flag_count, 
             cumulative_meter_reading
         ) VALUES (
             :node_id, 
             :hour, 
             :liters, 
             :peak, 
             :leaks, 
             :meter_reading
         )
         ON DUPLICATE KEY UPDATE
             total_volume_liters      = VALUES(total_volume_liters),
             peak_flow_rate_lpm       = GREATEST(peak_flow_rate_lpm, VALUES(peak_flow_rate_lpm)),
             leak_flag_count          = VALUES(leak_flag_count),
             cumulative_meter_reading = VALUES(cumulative_meter_reading)"
    );

    $upsertStmt->execute([
        ':node_id'       => $nodeId,
        ':hour'          => $currentHourTimestamp,
        ':liters'        => round($hourlyDeltaVolume, 2),
        ':peak'          => round($observedFlowRate, 2),
        ':leaks'         => $leakFlags,
        ':meter_reading' => round($currentCumulativeLiters, 2)
    ]);

    $compactedCount++;
}

// 8. Sliding-window cleanup: zero-out flow for packets unrefreshed for > 2 hours (INV-04)
$pruned = FirebaseCleanerService::pruneExpiredTelemetry();

echo "[" . date('Y-m-d H:i:s') . "] Compaction finished successfully.\n";
echo "  ↳ Compacted Nodes : {$compactedCount}\n";
echo "  ↳ Stale Pruned    : {$pruned} nodes\n\n";