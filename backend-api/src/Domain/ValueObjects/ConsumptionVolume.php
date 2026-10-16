<?php
declare(strict_types=1);

namespace Aquila\Domain\ValueObjects;

use InvalidArgumentException;

readonly class ConsumptionVolume
{
    public float $liters;

    public function __construct(float $liters)
    {
        if ($liters < 0.0) {
            throw new InvalidArgumentException("Consumption volume cannot be negative. Received: {$liters}");
        }
        $this->liters = round($liters, 2);
    }

    public function add(self $other): self
    {
        return new self($this->liters + $other->liters);
    }

    public function subtract(self $other): self
    {
        // Protects against reverse-meter tampering or negative deltas
        $result = max(0.0, $this->liters - $other->liters);
        return new self($result);
    }

    public function toCubicMeters(): float
    {
        // Standard water utility conversion: 1,000 Liters = 1.000 Cubic Meter
        return round($this->liters / 1000.0, 3);
    }

    public function equals(self $other): bool
    {
        return abs($this->liters - $other->liters) < 0.001;
    }
}