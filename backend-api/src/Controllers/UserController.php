<?php
declare(strict_types=1);

namespace Aquila\Controllers;

use Aquila\Config\Database;
use Aquila\Domain\DTOs\CreateUserDTO;
use Aquila\Domain\Entities\UserAccount;
use Aquila\Domain\Enums\UserRole;
use Aquila\Infrastructure\Repositories\MySQLUserRepository;
use Aquila\Middleware\JwtAuthMiddleware;
use Aquila\Services\AuditLogger;
use InvalidArgumentException;
use PDO;

class UserController
{
    private PDO $db;
    private MySQLUserRepository $userRepo;

    public function __construct()
    {
        $this->db = Database::getConnection();
        $this->userRepo = new MySQLUserRepository($this->db);
    }

    private function json(int $status, array $data): void
    {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode($data, JSON_PRETTY_PRINT);
        exit;
    }

    // 1. GET /api/v1/users (Filter: ?role=technician or ?role=resident)
    public function listUsers(): void
    {
        $currentUser = JwtAuthMiddleware::authenticate();

        if ($currentUser['role'] !== 'admin') {
            $this->json(403, ["success" => false, "error" => ["code" => "FORBIDDEN", "message" => "Only administrators can inspect user accounts."]]);
        }

        $roleFilter = $_GET['role'] ?? null;
        $sql = "SELECT u.user_id, u.first_name, u.middle_name, u.last_name, u.full_name, u.email, u.role, 
                       u.assigned_node_id, u.phone_number, u.emergency_contact, u.is_active, u.created_at,
                       n.household_label, n.location_name, n.purok_cluster
                FROM USER_ACCOUNT u
                LEFT JOIN MONITORING_NODE n ON u.assigned_node_id = n.node_id";
        
        $params = [];
        if ($roleFilter && in_array($roleFilter, ['admin', 'technician', 'resident'], true)) {
            $sql .= " WHERE u.role = :role";
            $params[':role'] = $roleFilter;
        }
        $sql .= " ORDER BY u.created_at DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $users = $stmt->fetchAll();

        $this->json(200, ["success" => true, "data" => ["total_users" => count($users), "users" => $users]]);
    }

    // 2. POST /api/v1/users (Create User with Atomic First/Middle/Last Name)
    public function createUser(): void
    {
        $currentUser = JwtAuthMiddleware::authenticate();

        if ($currentUser['role'] !== 'admin') {
            $this->json(403, ["success" => false, "error" => ["code" => "FORBIDDEN", "message" => "Only administrators can create users."]]);
        }

        $rawBody = json_decode(file_get_contents('php://input'), true) ?? [];

        try {
            $dto = CreateUserDTO::fromArray($rawBody);
        } catch (InvalidArgumentException $e) {
            $this->json(400, ["success" => false, "error" => ["code" => "INVALID_INPUT", "message" => $e->getMessage()]]);
        }

        // Email uniqueness validation
        if ($this->userRepo->existsByEmail($dto->email)) {
            $this->json(409, ["success" => false, "error" => ["code" => "EMAIL_EXISTS", "message" => "Email address is already in use."]]);
        }

        // Validate assigned node existence if provided
        if ($dto->assignedNodeId !== null) {
            $nodeCheck = $this->db->prepare("SELECT COUNT(*) FROM MONITORING_NODE WHERE node_id = :node");
            $nodeCheck->execute([':node' => $dto->assignedNodeId]);
            if ((int)$nodeCheck->fetchColumn() === 0) {
                $this->json(400, ["success" => false, "error" => ["code" => "INVALID_NODE", "message" => "Assigned node '{$dto->assignedNodeId}' does not exist."]]);
            }
        }

        $hash = password_hash($dto->password, PASSWORD_BCRYPT);
        $newUser = new UserAccount(
            userId: 0,
            firstName: $dto->firstName,
            middleName: $dto->middleName,
            lastName: $dto->lastName,
            fullName: '', // Computed automatically by MariaDB
            email: $dto->email,
            passwordHash: $hash,
            role: $dto->role,
            assignedNodeId: $dto->assignedNodeId,
            phoneNumber: $dto->phoneNumber,
            emergencyContact: $dto->emergencyContact,
            isActive: true,
            createdAt: date('Y-m-d H:i:s')
        );

        $newId = $this->userRepo->save($newUser);

        // Fetch back complete hydrated record including the generated full_name
        $savedUser = $this->userRepo->findById($newId);

        AuditLogger::log('USER_CREATED', (int)$currentUser['user_id'], null, "Created user {$savedUser->email} with role {$savedUser->role->value}");

        $this->json(201, [
            "success" => true,
            "data" => array_merge($savedUser->toSafeArray(), [
                "message" => "User account created successfully."
            ])
        ]);
    }

    // 3. PUT /api/v1/users/{id} (Update Profile, Role, & Node Assignment)
    public function updateUser(int $userId): void
    {
        $currentUser = JwtAuthMiddleware::authenticate();

        if ($currentUser['role'] !== 'admin') {
            $this->json(403, ["success" => false, "error" => ["code" => "FORBIDDEN", "message" => "Only administrators can update users."]]);
        }

        $targetUser = $this->userRepo->findById($userId);
        if (!$targetUser) {
            $this->json(404, ["success" => false, "error" => ["code" => "USER_NOT_FOUND", "message" => "User account not found."]]);
        }

        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        // Parse atomic name parts (with fallback if single full_name was sent)
        $first = trim((string)($data['first_name'] ?? $targetUser->firstName));
        $middle = isset($data['middle_name']) ? (empty($data['middle_name']) ? null : trim((string)$data['middle_name'])) : $targetUser->middleName;
        $last = trim((string)($data['last_name'] ?? $targetUser->lastName));

        if (!empty($data['full_name']) && empty($data['first_name'])) {
            $parts = explode(' ', trim((string)$data['full_name']), 2);
            $first = $parts[0];
            $last = $parts[1] ?? $targetUser->lastName;
        }

        $email = trim((string)($data['email'] ?? $targetUser->email));
        $newRoleStr = strtolower(trim((string)($data['role'] ?? $targetUser->role->value)));
        $newRole = UserRole::tryFrom($newRoleStr) ?? $targetUser->role;
        $nodeId = isset($data['assigned_node_id']) ? ($data['assigned_node_id'] ? trim((string)$data['assigned_node_id']) : null) : $targetUser->assignedNodeId;

        // Last-Admin Lockout Guardrail
        if ($targetUser->role === UserRole::ADMIN && $newRole !== UserRole::ADMIN) {
            if ($this->userRepo->countAdmins() <= 1) {
                $this->json(409, [
                    "success" => false,
                    "error" => ["code" => "LAST_ADMIN_LOCKOUT", "message" => "Cannot demote the sole remaining administrator account."]
                ]);
            }
        }

        // Resident-Node Consistency (INV-05)
        if ($newRole->requiresAssignedNode() && empty($nodeId)) {
            $this->json(400, ["success" => false, "error" => ["code" => "MISSING_NODE", "message" => "Resident role requires assigned_node_id."]]);
        }
        if (!$newRole->requiresAssignedNode()) {
            $nodeId = null;
        }

        $passwordHash = null;
        if (!empty($data['password'])) {
            $passwordHash = password_hash((string)$data['password'], PASSWORD_BCRYPT);
        }

        $updatedUser = new UserAccount(
            userId: $userId,
            firstName: $first,
            middleName: $middle,
            lastName: $last,
            fullName: '', // Generated by MariaDB
            email: $email,
            passwordHash: $passwordHash ?? $targetUser->passwordHash,
            role: $newRole,
            assignedNodeId: $nodeId,
            phoneNumber: isset($data['phone_number']) ? trim((string)$data['phone_number']) : $targetUser->phoneNumber,
            emergencyContact: isset($data['emergency_contact']) ? trim((string)$data['emergency_contact']) : $targetUser->emergencyContact,
            isActive: isset($data['is_active']) ? (bool)$data['is_active'] : $targetUser->isActive,
            createdAt: $targetUser->createdAt
        );

        $this->userRepo->save($updatedUser, $passwordHash);

        $freshUser = $this->userRepo->findById($userId);
        AuditLogger::log('USER_UPDATED', (int)$currentUser['user_id'], null, "Updated user ID {$userId} ({$freshUser->email})");

        $this->json(200, ["success" => true, "data" => $freshUser->toSafeArray()]);
    }

    // 4. DELETE /api/v1/users/{id} (With Last-Admin & Self-Deletion Protection)
    public function deleteUser(int $userId): void
    {
        $currentUser = JwtAuthMiddleware::authenticate();

        if ($currentUser['role'] !== 'admin') {
            $this->json(403, ["success" => false, "error" => ["code" => "FORBIDDEN", "message" => "Only administrators can delete users."]]);
        }

        if ((int)$currentUser['user_id'] === $userId) {
            $this->json(400, ["success" => false, "error" => ["code" => "CANNOT_DELETE_SELF", "message" => "You cannot delete your own active administrator account."]]);
        }

        $target = $this->userRepo->findById($userId);
        if (!$target) {
            $this->json(404, ["success" => false, "error" => ["code" => "USER_NOT_FOUND", "message" => "User account not found."]]);
        }

        if ($target->role === UserRole::ADMIN && $this->userRepo->countAdmins() <= 1) {
            $this->json(409, ["success" => false, "error" => ["code" => "LAST_ADMIN_LOCKOUT", "message" => "Cannot delete the sole remaining administrator account."]]);
        }

        $this->userRepo->delete($userId);
        AuditLogger::log('USER_DELETED', (int)$currentUser['user_id'], null, "Deleted user ID {$userId} ({$target->email})");

        $this->json(200, ["success" => true, "data" => ["message" => "User ID {$userId} deleted successfully."]]);
    }
}