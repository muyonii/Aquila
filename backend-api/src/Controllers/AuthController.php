<?php
declare(strict_types=1);

namespace Aquila\Controllers;

use Aquila\Config\Security;
use Aquila\Domain\Entities\UserAccount;
use Aquila\Infrastructure\Repositories\MySQLUserRepository;
use Aquila\Middleware\JwtAuthMiddleware;
use Aquila\Services\AuditLogger;
use Firebase\JWT\JWT;

class AuthController
{
    private MySQLUserRepository $userRepo;

    public function __construct()
    {
        $this->userRepo = new MySQLUserRepository();
    }

    private function json(int $status, array $data): void
    {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode($data, JSON_PRETTY_PRINT);
        exit;
    }

    // 1. POST /api/v1/auth/login
    public function login(): void
    {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $email = trim((string)($data['email'] ?? ''));
        $password = (string)($data['password'] ?? '');

        if (empty($email) || empty($password)) {
            $this->json(400, ["success" => false, "error" => ["code" => "MISSING_CREDENTIALS", "message" => "Email and password are required."]]);
        }

        $user = $this->userRepo->findByEmail($email);

        if (!$user || !password_verify($password, $user->passwordHash)) {
            $this->json(401, ["success" => false, "error" => ["code" => "INVALID_CREDENTIALS", "message" => "Invalid email or password."]]);
        }

        if (!$user->isActive) {
            $this->json(403, ["success" => false, "error" => ["code" => "ACCOUNT_DEACTIVATED", "message" => "This account has been deactivated."]]);
        }

        $issuedAt = time();
        $expiresAt = $issuedAt + Security::JWT_EXPIRATION_SECONDS;

        $payload = [
            "iss" => "AQUILA-Auth-Service",
            "iat" => $issuedAt,
            "exp" => $expiresAt,
            "sub" => $user->userId,
            "data" => [
                "user_id"          => $user->userId,
                "first_name"       => $user->firstName,
                "last_name"        => $user->lastName,
                "full_name"        => $user->fullName,
                "email"            => $user->email,
                "role"             => $user->role->value,
                "assigned_node_id" => $user->assignedNodeId
            ]
        ];

        $token = JWT::encode($payload, Security::getJwtSecret(), Security::JWT_ALGORITHM);

        AuditLogger::log('USER_LOGIN', $user->userId, null, "User {$user->email} authenticated.");

        $this->json(200, [
            "success" => true,
            "data" => [
                "token"      => $token,
                "expires_in" => Security::JWT_EXPIRATION_SECONDS,
                "user"       => $user->toSafeArray()
            ]
        ]);
    }

    // 2. GET /api/v1/auth/me (Session Restore)
    public function getMe(): void
    {
        $currentUser = JwtAuthMiddleware::authenticate();
        $user = $this->userRepo->findById((int)$currentUser['user_id']);

        if (!$user) {
            $this->json(404, ["success" => false, "error" => ["code" => "USER_NOT_FOUND", "message" => "User account no longer exists."]]);
        }

        $this->json(200, ["success" => true, "data" => $user->toSafeArray()]);
    }

    // 3. POST /api/v1/auth/change-password
    public function changePassword(): void
    {
        $currentUser = JwtAuthMiddleware::authenticate();
        $userId = (int)$currentUser['user_id'];

        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $currentPassword = (string)($data['current_password'] ?? '');
        $newPassword     = (string)($data['new_password'] ?? '');

        if (strlen($newPassword) < 8) {
            $this->json(400, ["success" => false, "error" => ["code" => "WEAK_PASSWORD", "message" => "New password must be at least 8 characters long."]]);
        }

        $user = $this->userRepo->findById($userId);
        if (!$user || !password_verify($currentPassword, $user->passwordHash)) {
            $this->json(401, ["success" => false, "error" => ["code" => "INVALID_CURRENT_PASSWORD", "message" => "Current password is incorrect."]]);
        }

        $newHash = password_hash($newPassword, PASSWORD_BCRYPT);
        $this->userRepo->save($user, $newHash);

        AuditLogger::log('PASSWORD_CHANGED', $userId, null, "User updated their password.");

        $this->json(200, ["success" => true, "data" => ["message" => "Password updated successfully."]]);
    }
}