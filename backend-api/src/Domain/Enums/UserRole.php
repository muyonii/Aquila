<?php
declare(strict_types=1);

namespace Aquila\Domain\Enums;

enum UserRole: string
{
    case ADMIN = 'admin';
    case TECHNICIAN = 'technician';
    case RESIDENT = 'resident';

    public function canManageUsers(): bool
    {
        return $this === self::ADMIN;
    }

    public function canManageNodes(): bool
    {
        return $this === self::ADMIN;
    }

    public function canDispatchWorkOrders(): bool
    {
        return $this === self::ADMIN;
    }

    public function canSubmitRepairs(): bool
    {
        return in_array($this, [self::ADMIN, self::TECHNICIAN], true);
    }

    public function requiresAssignedNode(): bool
    {
        return $this === self::RESIDENT;
    }
}
