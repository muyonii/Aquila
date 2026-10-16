<?php
declare(strict_types=1);

namespace Aquila\Controllers;

use Aquila\Utils\Uuid;
use Aquila\Config\AppConfig;
use Aquila\Config\Database;
use Aquila\Domain\Entities\IncidentTicket;
use Aquila\Domain\Enums\IncidentSeverity;
use Aquila\Domain\Enums\IncidentStatus;
use Aquila\Domain\Enums\UserRole;
use Aquila\Domain\ValueObjects\FlowRate;
use Aquila\Infrastructure\Repositories\MySQLIncidentRepository;
use Aquila\Middleware\JwtAuthMiddleware;
use Aquila\Middleware\RoleMiddleware;
use Aquila\Services\AuditLogger;
use Aquila\Services\RepairVerificationService;
use PDO;

class IncidentController
{
    private PDO $db;
    private MySQLIncidentRepository $incidentRepo;
    private RepairVerificationService $verificationService;

    public function __construct()
    {
        $this->db = Database::getConnection();
        $this->incidentRepo = new MySQLIncidentRepository($this->db);
        $this->verificationService = new RepairVerificationService();
    }

    private function json(int $status, array $data): void
    {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode($data, JSON_PRETTY_PRINT);
        exit;
    }

    // 1. GET /api/v1/incidents
    public function listIncidents(): void
    {
        $user = JwtAuthMiddleware::authenticate();
        $role = $user['role'];

        if ($role === UserRole::TECHNICIAN->value) {
            $stmt = $this->db->prepare(
                "SELECT t.*, n.household_label, n.location_name, n.purok_cluster 
                 FROM INCIDENT_TICKET t
                 JOIN MONITORING_NODE n ON t.node_id = n.node_id 
                 WHERE t.assigned_technician_id = :id
                 ORDER BY FIELD(t.status, 'DISPATCHED', 'PENDING_VERIFICATION', 'REPAIR_FAILED', 'OPEN', 'CLOSED_VERIFIED', 'CANCELLED'), t.detected_at DESC"
            );
            $stmt->execute([':id' => $user['user_id']]);
        } elseif ($role === UserRole::RESIDENT->value) {
            $stmt = $this->db->prepare("SELECT * FROM INCIDENT_TICKET WHERE node_id = :id ORDER BY detected_at DESC");
            $stmt->execute([':id' => (string)($user['assigned_node_id'] ?? '')]);
        } else {
            $stmt = $this->db->query(
                "SELECT t.*, n.household_label, n.location_name, n.purok_cluster, u.full_name AS assigned_technician_name
                 FROM INCIDENT_TICKET t 
                 JOIN MONITORING_NODE n ON t.node_id = n.node_id
                 LEFT JOIN USER_ACCOUNT u ON t.assigned_technician_id = u.user_id
                 ORDER BY FIELD(t.status, 'OPEN', 'DISPATCHED', 'PENDING_VERIFICATION', 'REPAIR_FAILED', 'CLOSED_VERIFIED', 'CANCELLED'), t.detected_at DESC"
            );
        }

        $this->json(200, ["success" => true, "data" => $stmt->fetchAll()]);
    }

    // 2. GET /api/v1/incidents/{id}
    public function getIncidentDetails(string $id): void
    {
        JwtAuthMiddleware::authenticate();
        $stmt = $this->db->prepare(
            "SELECT t.*, n.household_label, n.location_name, n.purok_cluster, n.latitude, n.longitude, u.full_name AS assigned_technician_name
             FROM INCIDENT_TICKET t 
             JOIN MONITORING_NODE n ON t.node_id = n.node_id
             LEFT JOIN USER_ACCOUNT u ON t.assigned_technician_id = u.user_id 
             WHERE t.incident_id = :id LIMIT 1"
        );
        $stmt->execute([':id' => $id]);
        $ticket = $stmt->fetch();

        if (!$ticket) {
            $this->json(404, ["success" => false, "error" => ["code" => "NOT_FOUND", "message" => "Incident not found."]]);
        }

        $audits = $this->db->prepare(
            "SELECT a.log_id, a.action_taken, a.client_ip, a.remarks, a.logged_at, u.full_name AS performed_by_name
             FROM AUDIT_LOG_ENTRY a 
             JOIN USER_ACCOUNT u ON a.performed_by = u.user_id
             WHERE a.incident_id = :id ORDER BY a.logged_at ASC"
        );
        $audits->execute([':id' => $id]);

        $this->json(200, ["success" => true, "data" => ["incident" => $ticket, "audit_trail" => $audits->fetchAll()]]);
    }

    // 3. POST /api/v1/incidents (Manual Citizen Complaint Entry)
    public function createManualIncident(): void
    {
        $admin = RoleMiddleware::enforce(UserRole::ADMIN);
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $nodeId = trim((string)($data['node_id'] ?? ''));
        $notes = trim((string)($data['complaint_notes'] ?? 'Citizen walk-in complaint reported at BAWASA hall.'));

        if (empty($nodeId)) {
            $this->json(400, ["success" => false, "error" => ["code" => "MISSING_NODE", "message" => "node_id is required."]]);
        }

        $nodeExists = $this->db->prepare("SELECT COUNT(*) FROM MONITORING_NODE WHERE node_id = :id");
        $nodeExists->execute([':id' => $nodeId]);
        if ((int)$nodeExists->fetchColumn() === 0) {
            $this->json(404, ["success" => false, "error" => ["code" => "NODE_NOT_FOUND", "message" => "Node does not exist."]]);
        }

        $severity = IncidentSeverity::tryFrom((string)($data['severity_level'] ?? 'P1')) ?? IncidentSeverity::P1;
        $incidentId = Uuid::v4();

        $ticket = new IncidentTicket(
            incidentId: $incidentId,
            nodeId: $nodeId,
            incidentType: (string)($data['incident_type'] ?? 'CRITICAL_LEAK'),
            severityLevel: $severity,
            detectedAt: date('Y-m-d H:i:s'),
            verifiedAt: null,
            resolvedAt: null,
            assignedTechnicianId: null,
            status: IncidentStatus::OPEN,
            repairNotes: "[Manual Complaint]: " . $notes,
            actionCardTitle: 'Citizen Walk-in Complaint',
            actionDirective: "Inspect {$nodeId}. Resident reported: {$notes}"
        );
        
        $this->incidentRepo->save($ticket);

        AuditLogger::log('INCIDENT_MANUALLY_CREATED', (int)$admin['user_id'], $ticket->incidentId, "Manual report on {$nodeId}: {$notes}");

        $this->json(201, [
            "success" => true, 
            "data" => [
                "incident_id"    => $ticket->incidentId, 
                "node_id"        => $nodeId, 
                "status"         => "OPEN", 
                "severity_level" => $severity->value
            ]
        ]);
    }

    // 4. POST /api/v1/incidents/{id}/dispatch
    public function dispatchTechnician(string $id): void
    {
        $admin = RoleMiddleware::enforce(UserRole::ADMIN);
        $techId = (int)(json_decode(file_get_contents('php://input'), true)['technician_id'] ?? 0);

        $techCheck = $this->db->prepare("SELECT role FROM USER_ACCOUNT WHERE user_id = :id");
        $techCheck->execute([':id' => $techId]);
        if ($techCheck->fetchColumn() !== UserRole::TECHNICIAN->value) {
            $this->json(400, ["success" => false, "error" => ["code" => "INVALID_TECHNICIAN", "message" => "Assigned user is not an active technician."]]);
        }

        $ticket = $this->incidentRepo->findById($id);
        if (!$ticket) {
            $this->json(400, ["success" => false, "error" => ["code" => "CANNOT_DISPATCH", "message" => "Ticket not found."]]);
        }

        try {
            $ticket->dispatchTo($techId);
        } catch (\InvalidArgumentException $e) {
            $this->json(400, ["success" => false, "error" => ["code" => "CANNOT_DISPATCH", "message" => $e->getMessage()]]);
        }

        $this->incidentRepo->save($ticket);

        AuditLogger::log('TICKET_DISPATCHED', (int)$admin['user_id'], $id, "Assigned to technician ID {$techId}");
        $this->json(200, ["success" => true, "data" => ["incident_id" => $id, "status" => "DISPATCHED", "assigned_to" => $techId]]);
    }

    // 5. PATCH /api/v1/incidents/{id}/cancel (False Alarm Dismissal)
    public function cancelIncident(string $id): void
    {
        $admin = RoleMiddleware::enforce(UserRole::ADMIN);
        $reason = trim((string)(json_decode(file_get_contents('php://input'), true)['cancellation_reason'] ?? 'False alarm verified.'));

        $ticket = $this->incidentRepo->findById($id);
        if (!$ticket) {
            $this->json(400, ["success" => false, "error" => ["code" => "CANNOT_CANCEL", "message" => "Ticket not found."]]);
        }

        try {
            $ticket->cancel($reason);
        } catch (\InvalidArgumentException $e) {
            $this->json(400, ["success" => false, "error" => ["code" => "CANNOT_CANCEL", "message" => $e->getMessage()]]);
        }

        $this->incidentRepo->save($ticket);

        AuditLogger::log('INCIDENT_CANCELLED', (int)$admin['user_id'], $id, "Dismissed: {$reason}");
        $this->json(200, ["success" => true, "data" => ["incident_id" => $id, "status" => "CANCELLED", "message" => "Incident dismissed."]]);
    }

    // 6. POST /api/v1/incidents/{id}/verify-flow
    public function evaluateVerification(string $id): void
    {
        RoleMiddleware::enforce(UserRole::ADMIN, UserRole::TECHNICIAN);
        
        $ticket = $this->incidentRepo->findById($id);
        if (!$ticket || $ticket->status !== IncidentStatus::PENDING_VERIFICATION) {
            $this->json(400, ["success" => false, "error" => ["code" => "NOT_PENDING", "message" => "Ticket is not in PENDING_VERIFICATION state."]]);
        }

        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        if (isset($body['current_flow_rate_lpm'])) {
            $flowRate = (float)$body['current_flow_rate_lpm'];
        } else {
            $raw = @file_get_contents(AppConfig::getFirebaseUrl() . "/nodes/{$ticket->nodeId}/telemetry.json");
            $flowRate = (float)(json_decode((string)$raw, true)['flow_rate_lpm'] ?? 0.0);
        }

        $since = !empty($ticket->pendingVerificationSince) ? strtotime($ticket->pendingVerificationSince) : time();
        $elapsed = isset($body['elapsed_seconds']) ? (int)$body['elapsed_seconds'] : (time() - $since);

        $newStatus = $this->verificationService->evaluateQuiescentFlow($ticket, new FlowRate($flowRate), $elapsed);

        if ($newStatus !== IncidentStatus::PENDING_VERIFICATION) {
            $this->incidentRepo->save($ticket);
            AuditLogger::log('REPAIR_' . $newStatus->value, 1, $id, "Verification outcome: {$newStatus->value}");
            $this->json(200, ["success" => true, "data" => ["status" => $newStatus->value, "observed_lpm" => $flowRate]]);
        }

        $this->json(200, [
            "success" => true, 
            "data" => [
                "status"            => "PENDING_VERIFICATION", 
                "remaining_seconds" => max(0, AppConfig::REPAIR_VERIFICATION_SECONDS - $elapsed), 
                "observed_lpm"      => $flowRate
            ]
        ]);
    }
}