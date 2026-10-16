<?php
declare(strict_types=1);

namespace Aquila\Domain\DTOs;

use Aquila\Domain\Enums\UserRole;
use InvalidArgumentException;

readonly class CreateUserDTO
{
    public function __construct(
        public string $firstName,
        public ?string $middleName,
        public string $lastName,
        public string $email,
        public string $password,
        public UserRole $role,
        public ?string $assignedNodeId,
        public ?string $phoneNumber = null,
        public ?string $emergencyContact = null
    ) {}

    public static function fromArray(array $data): self
    {
        $first = trim((string)($data['first_name'] ?? ''));
        $middle = !empty($data['middle_name']) ? trim((string)$data['middle_name']) : null;
        $last = trim((string)($data['last_name'] ?? ''));

        // Backward compatibility: If client sends a single "full_name", split it
        if (empty($first) && !empty($data['full_name'])) {
            $parts = explode(' ', trim((string)$data['full_name']), 2);
            $first = $parts[0];
            $last = $parts[1] ?? 'User';
        }

        $email = trim((string)($data['email'] ?? ''));
        $pass = (string)($data['password'] ?? 'Password123!');
        $roleStr = strtolower(trim((string)($data['role'] ?? 'resident')));
        $node = !empty($data['assigned_node_id']) ? trim((string)$data['assigned_node_id']) : null;

        if (empty($first) || empty($last)) {
            throw new InvalidArgumentException("First name and last name are required.");
        }

        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException("A valid email address is required.");
        }

        $role = UserRole::tryFrom($roleStr);
        if ($role === null) {
            throw new InvalidArgumentException("Invalid user role. Allowed: admin, technician, resident.");
        }

        if ($role->requiresAssignedNode() && empty($node)) {
            throw new InvalidArgumentException("Resident accounts must be assigned to an active monitoring node (RA 10173).");
        }

        return new self(
            firstName: $first,
            middleName: $middle,
            lastName: $last,
            email: $email,
            password: $pass,
            role: $role,
            assignedNodeId: $role->requiresAssignedNode() ? $node : null,
            phoneNumber: !empty($data['phone_number']) ? trim((string)$data['phone_number']) : null,
            emergencyContact: !empty($data['emergency_contact']) ? trim((string)$data['emergency_contact']) : null
        );
    }
}