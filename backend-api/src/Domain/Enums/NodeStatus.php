<?php
declare(strict_types=1);

namespace Aquila\Domain\Enums;

enum NodeStatus: string
{
    case ACTIVE = 'ACTIVE';
    case INACTIVE = 'INACTIVE';
    case MAINTENANCE = 'MAINTENANCE';
    case FAULT = 'FAULT';

    public function isOperational(): bool
    {
        return $this === self::ACTIVE;
    }

    // Encapsulates the Alarm Suppression Rule for AI agents
    public function suppressesAlarms(): bool
    {
        return in_array($this, [self::MAINTENANCE, self::INACTIVE, self::FAULT], true);
    }
}