<?php
declare(strict_types=1);

namespace Aquila\Controllers;

use Aquila\Config\Database;
use Aquila\Middleware\JwtAuthMiddleware;
use PDO;

class AuditController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    // GET /api/v1/audit-logs
    public function listAuditLogs(): void
    {
        header('Content-Type: application/json');
        $currentUser = JwtAuthMiddleware::authenticate();

        if ($currentUser['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(["success" => false, "error" => ["code" => "FORBIDDEN", "message" => "Only administrators can inspect audit records."]]);
            return;
        }

        $stmt = $this->db->query(
            "SELECT a.*, u.full_name AS performed_by_name, u.role AS performed_by_role
             FROM AUDIT_LOG_ENTRY a
             JOIN USER_ACCOUNT u ON a.performed_by = u.user_id
             ORDER BY a.logged_at DESC LIMIT 50"
        );
        $logs = $stmt->fetchAll();

        echo json_encode([
            "success" => true,
            "data" => [
                "total_records" => count($logs),
                "audit_logs"    => $logs
            ]
        ], JSON_PRETTY_PRINT);
    }
}
