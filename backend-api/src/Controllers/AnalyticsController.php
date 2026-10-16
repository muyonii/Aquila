<?php
declare(strict_types=1);

namespace Aquila\Controllers;

use Aquila\Config\Database;
use Aquila\Middleware\JwtAuthMiddleware;
use PDO;

class AnalyticsController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    // GET /api/v1/analytics/summary (Cluster KPI overview)
    public function getClusterSummary(): void
    {
        header('Content-Type: application/json');
        JwtAuthMiddleware::authenticate(); // Requires valid session

        // 1. Total nodes count & status
        $nodesStmt = $this->db->query(
            "SELECT node_id, household_label, purok_cluster, is_physical, status 
             FROM MONITORING_NODE ORDER BY node_id ASC"
        );
        $nodes = $nodesStmt->fetchAll();

        // 2. Incident counters by status
        $ticketStmt = $this->db->query(
            "SELECT status, severity_level, COUNT(*) as total 
             FROM INCIDENT_TICKET 
             GROUP BY status, severity_level"
        );
        $ticketStats = $ticketStmt->fetchAll();

        // 3. Past 24h community water volume
        $volumeStmt = $this->db->query(
            "SELECT COALESCE(SUM(total_volume_liters), 0) as community_24h_liters 
             FROM HOURLY_SUMMARY 
             WHERE hour_timestamp >= NOW() - INTERVAL 24 HOUR"
        );
        $communityVolume = (float)$volumeStmt->fetchColumn();

        echo json_encode([
            "success" => true,
            "data" => [
                "total_nodes"          => count($nodes),
                "community_24h_liters" => round($communityVolume, 2),
                "nodes"                => $nodes,
                "incident_breakdown"   => $ticketStats,
                "system_status"        => "OPERATIONAL",
                "timestamp"            => time()
            ]
        ], JSON_PRETTY_PRINT);
    }
}
