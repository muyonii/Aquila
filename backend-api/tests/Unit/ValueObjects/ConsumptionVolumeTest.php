<?php
declare(strict_types=1);

namespace Aquila\Tests\Unit\ValueObjects;

use Aquila\Domain\ValueObjects\ConsumptionVolume;
use InvalidArgumentException;

class ConsumptionVolumeTest
{
    public function testAdditionAndCubicMeters(): void
    {
        $vol1 = new ConsumptionVolume(500.0);
        $vol2 = new ConsumptionVolume(750.50);
        $total = $vol1->add($vol2);

        assert($total->liters === 1250.50, 'Sum of liters should equal 1250.50');
        assert($total->toCubicMeters() === 1.251, '1250.50 liters should equal 1.251 m3');
    }

    public function testNegativeVolumeThrowsException(): void
    {
        try {
            new ConsumptionVolume(-1.0);
            assert(false, 'Negative volume must throw InvalidArgumentException');
        } catch (InvalidArgumentException $e) {
            assert(str_contains($e->getMessage(), 'cannot be negative'));
        }
    }
}