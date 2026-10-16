<?php
declare(strict_types=1);

namespace Aquila\Controllers;

use Aquila\Config\Database;
use Aquila\Domain\Entities\HourlySummary;
use Aquila\Domain\ValueObjects\ConsumptionVolume;
use Aquila\Infrastructure\Repositories\MySQLNodeRepository;
use Aquila\Middleware\RowLevelSecurityMiddleware;
use PDO;

class ResidentController
{
    private PDO $db;
    private MySQLNodeRepository $nodeRepo;

    public function __construct()
    {
        $this->db = Database::getConnection();
        $this->nodeRepo = new MySQLNodeRepository($this->db);
    }

    private function json(int $status, array $data): void
    {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode($data, JSON_PRETTY_PRINT);
        exit;
    }

    // GET /api/v1/resident/my-water
    public function getMyWater(): void
    {
        // Enforce Row-Level Security under RA 10173 (INV-05)
        $nodeId = RowLevelSecurityMiddleware::enforceTenantIsolation();

        $node = $this->nodeRepo->findById($nodeId);
        if (!$node) {
            $this->json(404, ["success" => false, "error" => ["code" => "NODE_NOT_FOUND", "message" => "Assigned household meter not found."]]);
        }

        // Fetch compacted hourly summaries for past 24 hours
        $stmt = $this->db->prepare(
            "SELECT * FROM HOURLY_SUMMARY 
             WHERE node_id = :node_id 
             ORDER BY hour_timestamp DESC LIMIT 24"
        );
        $stmt->execute([':node_id' => $nodeId]);
        $rows = $stmt->fetchAll();

        $summaries = array_map(fn($r) => HourlySummary::fromArray($r), $rows);

        $totalVolume = new ConsumptionVolume(0.0);
        foreach ($summaries as $summary) {
            $totalVolume = $totalVolume->add(new ConsumptionVolume($summary->totalVolumeLiters));
        }

        $this->json(200, [
            "success" => true,
            "data" => [
                "node_id"              => $node->nodeId,
                "household_label"      => $node->householdLabel,
                "location_name"        => $node->locationName, // Added location address
                "purok_cluster"        => $node->purokCluster,
                "total_24h_liters"     => $totalVolume->liters,
                "total_24h_m3"         => $totalVolume->toCubicMeters(),
                "hourly_records_count" => count($summaries),
                "history"              => $rows
            ]
        ]);
    }
}