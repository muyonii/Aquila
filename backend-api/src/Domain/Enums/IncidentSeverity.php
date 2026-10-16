<?php
declare(strict_types=1);

namespace Aquila\Domain\Enums;

enum IncidentSeverity: string
{
    case P1 = 'P1'; // Critical Pipe Rupture
    case P2 = 'P2'; // Severe Distribution Inequity
    case P3 = 'P3'; // Suspicious Usage Anomaly

    public function requiresImmediateDispatch(): bool
    {
        return $this === self::P1;
    }

    public function maxResolutionHours(): int
    {
        return match ($this) {
            self::P1 => 4,
            self::P2 => 24,
            self::P3 => 72,
        };
    }
}