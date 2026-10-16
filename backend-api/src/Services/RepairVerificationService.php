<?php
declare(strict_types=1);

namespace Aquila\Services;

use Aquila\Config\AppConfig;
use Aquila\Domain\Entities\IncidentTicket;
use Aquila\Domain\Enums\IncidentStatus;
use Aquila\Domain\ValueObjects\FlowRate;

class RepairVerificationService
{
    public function evaluateQuiescentFlow(IncidentTicket $ticket, FlowRate $observedRate, int $elapsedSeconds): IncidentStatus
    {
        // 1. Recurrence check: if water bursts >= 1.0 L/min, repair immediately fails
        if ($observedRate->litersPerMinute >= AppConfig::MECHANICAL_SENSOR_FLOOR_LPM) {
            $ticket->markFailed("Flow recurrent at {$observedRate->litersPerMinute} L/min during observation window.");
            return IncidentStatus::REPAIR_FAILED;
        }

        // 2. Success check: flow is quiescent (<=0.05 L/min) AND full 15 minutes have elapsed
        if ($observedRate->isQuiescent() && $elapsedSeconds >= AppConfig::REPAIR_VERIFICATION_SECONDS) {
            $ticket->verifySuccess();
            return IncidentStatus::CLOSED_VERIFIED;
        }

        // Still observing within the 15-minute window
        return IncidentStatus::PENDING_VERIFICATION;
    }
}
