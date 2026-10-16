<?php
declare(strict_types=1);

namespace Aquila\Infrastructure\Repositories;

use Aquila\Config\Database;
use Aquila\Domain\Entities\MonitoringNode;
use Aquila\Domain\Repositories\NodeRepositoryInterface;
use PDO;

class MySQLNodeRepository implements NodeRepositoryInterface
{
    private PDO $db;

    public function __construct(?PDO $db = null)
    {
        $this->db = $db ?? Database::getConnection();
    }

    public function findById(string $nodeId): ?MonitoringNode
    {
        $stmt = $this->db->prepare("SELECT * FROM MONITORING_NODE WHERE node_id = :id LIMIT 1");
        $stmt->execute([':id' => $nodeId]);
        $row = $stmt->fetch();

        return $row ? MonitoringNode::fromArray($row) : null;
    }

    public function findAll(): array
    {
        $stmt = $this->db->query("SELECT * FROM MONITORING_NODE ORDER BY node_id ASC");
        return array_map(fn($row) => MonitoringNode::fromArray($row), $stmt->fetchAll());
    }

    public function save(MonitoringNode $node): void
    {
        $stmt = $this->db->prepare(
            "INSERT INTO MONITORING_NODE 
             (node_id, household_label, location_name, purok_cluster, parent_node_id, latitude, longitude, is_physical, installation_date, status, device_token, battery_voltage)
             VALUES (:id, :label, :loc, :purok, :parent, :lat, :lng, :physical, :inst_date, :status, :token, :battery)
             ON DUPLICATE KEY UPDATE
                 household_label   = VALUES(household_label),
                 location_name     = VALUES(location_name),
                 purok_cluster     = VALUES(purok_cluster),
                 parent_node_id    = VALUES(parent_node_id),
                 latitude          = VALUES(latitude),
                 longitude         = VALUES(longitude),
                 status            = VALUES(status),
                 battery_voltage   = VALUES(battery_voltage)"
        );
        $stmt->execute([
            ':id'        => $node->nodeId,
            ':label'     => $node->householdLabel,
            ':loc'       => $node->locationName,
            ':purok'     => $node->purokCluster,
            ':parent'    => $node->parentNodeId,
            ':lat'       => $node->latitude,
            ':lng'       => $node->longitude,
            ':physical'  => $node->isPhysical ? 1 : 0,
            ':inst_date' => $node->installationDate,
            ':status'    => $node->status->value,
            ':token'     => $node->deviceToken,
            ':battery'   => $node->batteryVoltage
        ]);
    }

    public function delete(string $nodeId): void
    {
        $stmt = $this->db->prepare("DELETE FROM MONITORING_NODE WHERE node_id = :id");
        $stmt->execute([':id' => $nodeId]);
    }

    public function getNextSequentialId(): string
    {
        $stmt = $this->db->query("SELECT MAX(CAST(SUBSTRING(node_id, 9) AS UNSIGNED)) FROM MONITORING_NODE WHERE node_id LIKE 'NODE-B1-%'");
        $maxSeq = (int)$stmt->fetchColumn();
        return sprintf("NODE-B1-%03d", $maxSeq + 1);
    }

    public function exists(string $nodeId): bool
    {
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM MONITORING_NODE WHERE node_id = :id");
        $stmt->execute([':id' => $nodeId]);
        return (int)$stmt->fetchColumn() > 0;
    }
}