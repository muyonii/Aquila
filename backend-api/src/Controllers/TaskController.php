<?php
declare(strict_types=1);

namespace Aquila\Controllers;

use Aquila\Config\AppConfig;
use Aquila\Config\Database;
use Aquila\Domain\DTOs\SubmitRepairDTO;
use Aquila\Domain\Entities\IncidentTicket;
use Aquila\Domain\Enums\UserRole;
use Aquila\Infrastructure\Repositories\MySQLIncidentRepository;
use Aquila\Middleware\JwtAuthMiddleware;
use Aquila\Middleware\RoleMiddleware;
use Aquila\Services\AuditLogger;
use PDO;

class TaskController
{
    private PDO $db;
    private MySQLIncidentRepository $incidentRepo;

    public function __construct()
    {
        $this->db = Database::getConnection();
        $this->incidentRepo = new MySQLIncidentRepository($this->db);
    }

    private function json(int $status, array $data): void
    {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode($data, JSON_PRETTY_PRINT);
        exit;
    }

    // 1. GET /api/v1/tasks (Assigned queue for logged-in technician)
    public function getMyTasks(): void
    {
        $currentUser = RoleMiddleware::enforce(UserRole::TECHNICIAN, UserRole::ADMIN);
        $techId = (int)$currentUser['user_id'];

        $stmt = $this->db->prepare(
            "SELECT t.incident_id, t.node_id, t.incident_type, t.severity_level, 
                    t.detected_at, t.status, t.repair_notes, t.pending_verification_since,
                    n.household_label, n.location_name, n.purok_cluster, n.latitude, n.longitude
             FROM INCIDENT_TICKET t
             JOIN MONITORING_NODE n ON t.node_id = n.node_id
             WHERE t.assigned_technician_id = :tech_id 
               AND t.status IN ('DISPATCHED', 'PENDING_VERIFICATION', 'REPAIR_FAILED')
             ORDER BY FIELD(t.status, 'DISPATCHED', 'REPAIR_FAILED', 'PENDING_VERIFICATION'), t.detected_at DESC"
        );
        $stmt->execute([':tech_id' => $techId]);
        $tasks = $stmt->fetchAll();

        $this->json(200, [
            "success" => true,
            "data" => [
                "technician_id"   => $techId,
                "technician_name" => $currentUser['full_name'],
                "active_tasks"    => count($tasks),
                "tasks"           => $tasks
            ]
        ]);
    }

    // 2. GET /api/v1/tasks/{id} (Task Details & Tactical GPS Coordinates)
    public function getTaskDetails(string $id): void
    {
        $currentUser = JwtAuthMiddleware::authenticate();
        $techId = (int)$currentUser['user_id'];
        $isAdmin = ($currentUser['role'] === UserRole::ADMIN->value);

        $stmt = $this->db->prepare(
            "SELECT t.*, n.household_label, n.location_name, n.purok_cluster, n.latitude, n.longitude, n.is_physical
             FROM INCIDENT_TICKET t
             JOIN MONITORING_NODE n ON t.node_id = n.node_id
             WHERE t.incident_id = :id AND (:is_admin = 1 OR t.assigned_technician_id = :tech_id)
             LIMIT 1"
        );
        $stmt->execute([':id' => $id, ':is_admin' => $isAdmin ? 1 : 0, ':tech_id' => $techId]);
        $task = $stmt->fetch();

        if (!$task) {
            $this->json(404, ["success" => false, "error" => ["code" => "TASK_NOT_FOUND", "message" => "Task not found or not assigned to you."]]);
        }

        $this->json(200, ["success" => true, "data" => $task]);
    }

    // 3. PATCH /api/v1/tasks/{id}/repair (Submit Notes & Start 15-Min Observation Window)
    public function submitRepair(string $id): void
    {
        $currentUser = RoleMiddleware::enforce(UserRole::TECHNICIAN, UserRole::ADMIN);
        $rawBody = json_decode(file_get_contents('php://input'), true) ?? [];
        $dto = SubmitRepairDTO::fromArray($id, $rawBody);

        if (empty($dto->repairNotes)) {
            $this->json(400, ["success" => false, "error" => ["code" => "MISSING_NOTES", "message" => "Repair notes are required."]]);
        }

        $ticket = $this->incidentRepo->findById($id);
        if (!$ticket) {
            $this->json(404, ["success" => false, "error" => ["code" => "TASK_NOT_FOUND", "message" => "Task not found."]]);
        }

        // Rich Domain Entity sets status to PENDING_VERIFICATION and marks pendingVerificationSince = NOW()
        try {
            $ticket->submitRepair($dto->repairNotes);
        } catch (\InvalidArgumentException $e) {
            $this->json(400, ["success" => false, "error" => ["code" => "INVALID_STATE", "message" => $e->getMessage()]]);
        }

        $this->incidentRepo->save($ticket);

        AuditLogger::log('REPAIR_SUBMITTED', (int)$currentUser['user_id'], $id, "Submitted repair notes: {$dto->repairNotes}");

        $this->json(200, [
            "success" => true,
            "data" => [
                "incident_id"                 => $id,
                "status"                      => $ticket->status->value,
                "pending_verification_since"  => $ticket->pendingVerificationSince,
                "verification_window_seconds" => AppConfig::REPAIR_VERIFICATION_SECONDS,
                "message"                     => "Repair submitted. Initiated 15-minute post-repair observation."
            ]
        ]);
    }
}