<?php
declare(strict_types=1);

namespace Aquila\Middleware;

use Aquila\Domain\Enums\UserRole;

class RowLevelSecurityMiddleware
{
    public static function enforceTenantIsolation(): string
    {
        $user = JwtAuthMiddleware::authenticate();
        $role = UserRole::tryFrom((string)($user['role'] ?? ''));

        if ($role === null) {
            http_response_code(403);
            header('Content-Type: application/json');
            echo json_encode([
                "success" => false,
                "error" => ["code" => "INVALID_ROLE", "message" => "User token contains an invalid role."]
            ], JSON_PRETTY_PRINT);
            exit;
        }

        // Admins & Technicians: allowed to inspect any requested node (defaults to NODE-B1-001)
        if ($role === UserRole::ADMIN || $role === UserRole::TECHNICIAN) {
            $requestedNode = trim((string)($_GET['node_id'] ?? ''));
            return !empty($requestedNode) ? $requestedNode : 'NODE-B1-001';
        }

        // Residents: strictly bound to their assigned meter under RA 10173 (INV-05)
        // Ignores any spoofed ?node_id= in the query parameters
        $assignedNode = trim((string)($user['assigned_node_id'] ?? ''));
        if (empty($assignedNode)) {
            http_response_code(403);
            header('Content-Type: application/json');
            echo json_encode([
                "success" => false,
                "error" => [
                    "code" => "NO_ASSIGNED_NODE", 
                    "message" => "Resident account not bound to any household meter (RA 10173)."
                ]
            ], JSON_PRETTY_PRINT);
            exit;
        }

        return $assignedNode;
    }
}