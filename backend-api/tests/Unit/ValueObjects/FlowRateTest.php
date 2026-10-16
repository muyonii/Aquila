<?php
declare(strict_types=1);

namespace Aquila\Tests\Unit\ValueObjects;

use Aquila\Domain\ValueObjects\FlowRate;
use InvalidArgumentException;

class FlowRateTest
{
    public function testValidFlowRate(): void
    {
        $flow = new FlowRate(3.424);
        assert($flow->litersPerMinute === 3.42, 'Flow rate should round to 2 decimal places');
    }

    public function testNegativeFlowThrowsException(): void
    {
        try {
            new FlowRate(-0.1);
            assert(false, 'Negative flow rate must throw InvalidArgumentException');
        } catch (InvalidArgumentException $e) {
            assert(str_contains($e->getMessage(), 'cannot be negative'));
        }
    }

    public function testExceedingHydraulicCapacityThrowsException(): void
    {
        try {
            new FlowRate(45.5);
            assert(false, 'Flow rate exceeding 45 LPM must throw InvalidArgumentException');
        } catch (InvalidArgumentException $e) {
            assert(str_contains($e->getMessage(), 'hydraulic capacity'));
        }
    }

    public function testQuiescentDetection(): void
    {
        $stillFlow = new FlowRate(0.04);
        assert($stillFlow->isQuiescent() === true, 'Flow <= 0.05 LPM must be identified as quiescent');

        $activeFlow = new FlowRate(0.06);
        assert($activeFlow->isQuiescent() === false, 'Flow > 0.05 LPM must not be quiescent');
    }
}