<?php
declare(strict_types=1);

namespace Aquila\Domain\ValueObjects;

use Aquila\Config\AppConfig;
use InvalidArgumentException;

readonly class RdiScore
{
    public float $score;

    public function __construct(float $score)
    {
        if ($score < 0.0) {
            throw new InvalidArgumentException("RDI score cannot be negative. Received: {$score}");
        }
        $this->score = round($score, 3);
    }

    /**
     * Rule BR-04: Household is disadvantaged if receiving less than 70% of community mean.
     */
    public function isDisadvantaged(): bool
    {
        return $this->score < AppConfig::RAWLSIAN_RDI_CUTOFF;
    }

    /**
     * High consumer threshold (> 130% of community mean).
     */
    public function isHighConsumer(): bool
    {
        return $this->score > 1.30;
    }

    public function getClassification(): string
    {
        if ($this->isDisadvantaged()) {
            return 'DISADVANTAGED';
        }
        if ($this->isHighConsumer()) {
            return 'HIGH_CONSUMER';
        }
        return 'NORMAL';
    }

    public function equals(self $other): bool
    {
        return abs($this->score - $other->score) < 0.001;
    }
}