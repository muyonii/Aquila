<?php
declare(strict_types=1);

namespace Aquila\Infrastructure\Repositories;

use Aquila\Config\Database;
use Aquila\Domain\Entities\IncidentTicket;
use Aquila\Domain\Repositories\IncidentRepositoryInterface;
use PDO;

class MySQLIncidentRepository implements IncidentRepositoryInterface
{
    private PDO $db;

    public function __construct(?PDO $db = null)
    {
        $this->db = $db ?? Database::getConnection();
    }

    public function findById(string $incidentId): ?IncidentTicket
    {
        $stmt = $this->db->prepare("SELECT * FROM INCIDENT_TICKET WHERE incident_id = :id LIMIT 1");
        $stmt->execute([':id' => $incidentId]);
        $row = $stmt->fetch();

        return $row ? IncidentTicket::fromArray($row) : null;
    }

    public function findActiveByNodeId(string $nodeId): ?IncidentTicket
    {
        $stmt = $this->db->prepare(
            "SELECT * FROM INCIDENT_TICKET 
             WHERE node_id = :node_id AND status IN ('OPEN', 'DISPATCHED', 'PENDING_VERIFICATION') 
             LIMIT 1"
        );
        $stmt->execute([':node_id' => $nodeId]);
        $row = $stmt->fetch();

        return $row ? IncidentTicket::fromArray($row) : null;
    }

    public function save(IncidentTicket $incident): void
    {
        // Every named parameter (:placeholder) appears strictly once to satisfy PDO
        $stmt = $this->db->prepare(
            "INSERT INTO INCIDENT_TICKET 
             (incident_id, node_id, incident_type, severity_level, action_card_title, action_directive, detected_at, status, repair_notes, pending_verification_since, verified_at, resolved_at, assigned_technician_id)
             VALUES (:id, :node_id, :type, :severity, :title, :directive, :detected_at, :status, :notes, :pending_since, :verified_at, :resolved_at, :tech_id)
             ON DUPLICATE KEY UPDATE
                 status                     = VALUES(status),
                 assigned_technician_id     = VALUES(assigned_technician_id),
                 repair_notes               = VALUES(repair_notes),
                 pending_verification_since = VALUES(pending_verification_since),
                 verified_at                = VALUES(verified_at),
                 resolved_at                = VALUES(resolved_at)"
        );
        $stmt->execute([
            ':id'            => $incident->incidentId,
            ':node_id'       => $incident->nodeId,
            ':type'          => $incident->incidentType,
            ':severity'      => $incident->severityLevel->value,
            ':title'         => $incident->actionCardTitle ?? 'Incident Work Order',
            ':directive'     => $incident->actionDirective ?? ('Inspect node ' . $incident->nodeId),
            ':detected_at'   => $incident->detectedAt,
            ':status'        => $incident->status->value,
            ':notes'         => $incident->repairNotes,
            ':pending_since' => $incident->pendingVerificationSince,
            ':verified_at'   => $incident->verifiedAt,
            ':resolved_at'   => $incident->resolvedAt,
            ':tech_id'       => $incident->assignedTechnicianId
        ]);
    }

    public function findAll(): array
    {
        $stmt = $this->db->query("SELECT * FROM INCIDENT_TICKET ORDER BY detected_at DESC");
        return array_map(fn($row) => IncidentTicket::fromArray($row), $stmt->fetchAll());
    }
}