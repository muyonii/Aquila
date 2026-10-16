<?php
declare(strict_types=1);

namespace Aquila\Services;

use Aquila\Config\Database;
use Aquila\Utils\Uuid;
use PDO;

class IncidentDebouncer
{
    private PDO $db;

    public function __construct(?PDO $db = null)
    {
        $this->db = $db ?? Database::getConnection();
    }

    public function processIncident(array $payload): array
    {
        $nodeId = trim((string)($payload['node_id'] ?? ''));
        $incidentType = (string)($payload['incident_type'] ?? 'CRITICAL_LEAK');
        $severity = (string)($payload['severity_level'] ?? 'P1');
        $recommendation = (array)($payload['recommendation'] ?? []);

        if (empty($nodeId)) {
            return [
                "action"  => "REJECTED",
                "message" => "Missing required field: node_id."
            ];
        }

        // 1. Verify node exists to prevent unhandled Foreign Key crashes
        $nodeCheck = $this->db->prepare("SELECT COUNT(*) FROM MONITORING_NODE WHERE node_id = :id");
        $nodeCheck->execute([':id' => $nodeId]);
        if ((int)$nodeCheck->fetchColumn() === 0) {
            return [
                "action"  => "REJECTED",
                "message" => "Node '{$nodeId}' is not registered in the infrastructure database."
            ];
        }

        // 2. Debounce Check (BR-03): Check for existing active work order on this node
        $stmt = $this->db->prepare(
            "SELECT incident_id, status FROM INCIDENT_TICKET 
             WHERE node_id = :node_id AND status IN ('OPEN', 'DISPATCHED', 'PENDING_VERIFICATION') 
             LIMIT 1"
        );
        $stmt->execute([':node_id' => $nodeId]);
        $existingTicket = $stmt->fetch();

        if ($existingTicket) {
            return [
                "action"      => "DEBOUNCED",
                "incident_id" => $existingTicket['incident_id'],
                "message"     => "Active ticket already exists for node. Duplicate suppressed under Rule BR-03."
            ];
        }

        // 3. Extract Recommendation Agent directives (INV-01)
        $cardTitle = (string)($recommendation['title'] ?? 'Incident Work Order');
        $directive = (string)($recommendation['action_directive'] ?? "Inspect conduit branch at {$nodeId}.");
        $repairNotes = "[Automated Recommendation]: " . $directive;

        // 4. Validate supplied incident_id or generate a cryptographically secure UUIDv4
        $suppliedId = isset($payload['incident_id']) ? (string)$payload['incident_id'] : null;
        $incidentId = ($suppliedId !== null && Uuid::isValid($suppliedId))
            ? $suppliedId
            : Uuid::v4();

        $now = date('Y-m-d H:i:s');

        // 5. Insert into INCIDENT_TICKET
        $insert = $this->db->prepare(
            "INSERT INTO INCIDENT_TICKET (
                 incident_id, 
                 node_id, 
                 incident_type, 
                 severity_level, 
                 action_card_title, 
                 action_directive, 
                 detected_at, 
                 status, 
                 repair_notes
             ) VALUES (
                 :id, 
                 :node_id, 
                 :type, 
                 :severity, 
                 :title, 
                 :directive, 
                 :detected_at, 
                 'OPEN', 
                 :notes
             )"
        );
        $insert->execute([
            ':id'          => $incidentId,
            ':node_id'     => $nodeId,
            ':type'        => $incidentType,
            ':severity'    => $severity,
            ':title'       => $cardTitle,
            ':directive'   => $directive,
            ':detected_at' => $now,
            ':notes'       => $repairNotes
        ]);

        // 6. Append to Immutable Audit Ledger via unified AuditLogger (INV-06)
        AuditLogger::log(
            'INCIDENT_AUTO_CREATED',
            1, // System Actor ID
            $incidentId,
            "Automated detection: {$incidentType} ({$severity}) on {$nodeId}"
        );

        return [
            "action"      => "CREATED",
            "incident_id" => $incidentId,
            "message"     => "Incident ticket and audit log successfully registered."
        ];
    }
}