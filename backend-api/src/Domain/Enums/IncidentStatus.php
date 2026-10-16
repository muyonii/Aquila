<?php
declare(strict_types=1);

namespace Aquila\Domain\Enums;

enum IncidentStatus: string
{
    case OPEN = 'OPEN';
    case DISPATCHED = 'DISPATCHED';
    case PENDING_VERIFICATION = 'PENDING_VERIFICATION';
    case CLOSED_VERIFIED = 'CLOSED_VERIFIED';
    case REPAIR_FAILED = 'REPAIR_FAILED';
    case CANCELLED = 'CANCELLED'; // False alarm dismissal

    public function isTerminal(): bool
    {
        return in_array($this, [self::CLOSED_VERIFIED, self::REPAIR_FAILED, self::CANCELLED], true);
    }

    public function canTransitionTo(self $target): bool
    {
        return match ($this) {
            self::OPEN => in_array($target, [self::DISPATCHED, self::CLOSED_VERIFIED, self::CANCELLED], true),
            self::DISPATCHED => in_array($target, [self::PENDING_VERIFICATION, self::OPEN, self::CANCELLED], true),
            self::PENDING_VERIFICATION => in_array($target, [self::CLOSED_VERIFIED, self::REPAIR_FAILED], true),
            self::REPAIR_FAILED => in_array($target, [self::DISPATCHED, self::PENDING_VERIFICATION, self::CANCELLED], true),
            self::CLOSED_VERIFIED, self::CANCELLED => false,
        };
    }
}
