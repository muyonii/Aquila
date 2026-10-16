<?php
declare(strict_types=1);

namespace Aquila\Tests\Unit\Services;

use Aquila\Domain\Entities\IncidentTicket;
use Aquila\Domain\Enums\IncidentSeverity;
use Aquila\Domain\Enums\IncidentStatus;
use Aquila\Domain\ValueObjects\FlowRate;
use Aquila\Services\RepairVerificationService;

class RepairVerificationServiceTest
{
    private function createPendingTicket(): IncidentTicket
    {
        return new IncidentTicket(
            incidentId: 'test-uuid-002',
            nodeId: 'NODE-B1-003',
            incidentType: 'CRITICAL_LEAK',
            severityLevel: IncidentSeverity::P1,
            detectedAt: '2026-09-28 10:00:00',
            verifiedAt: null,
            resolvedAt: null,
            assignedTechnicianId: 2,
            status: IncidentStatus::PENDING_VERIFICATION,
            repairNotes: 'Pipe coupling clamped.'
        );
    }

    public function testSuccessfulAutoClosureAfter15MinutesQuiescent(): void
    {
        $service = new RepairVerificationService();
        $ticket = $this->createPendingTicket();

        // 0.02 LPM (quiescent) and 900 seconds elapsed (15 min)
        $outcome = $service->evaluateQuiescentFlow($ticket, new FlowRate(0.02), 900);

        assert($outcome === IncidentStatus::CLOSED_VERIFIED, 'Ticket must be CLOSED_VERIFIED when quiescent for 900s');
        assert($ticket->status === IncidentStatus::CLOSED_VERIFIED);
        assert($ticket->verifiedAt !== null);
    }

    public function testStillPendingWhenUnder15Minutes(): void
    {
        $service = new RepairVerificationService();
        $ticket = $this->createPendingTicket();

        // 0.02 LPM (quiescent), but only 450 seconds elapsed
        $outcome = $service->evaluateQuiescentFlow($ticket, new FlowRate(0.02), 450);

        assert($outcome === IncidentStatus::PENDING_VERIFICATION, 'Ticket must remain PENDING_VERIFICATION before 900s elapsed');
    }

    public function testRecurrentFlowFailsRepairImmediately(): void
    {
        $service = new RepairVerificationService();
        $ticket = $this->createPendingTicket();

        // Flow burst: 2.10 LPM >= 1.0 LPM mechanical floor
        $outcome = $service->evaluateQuiescentFlow($ticket, new FlowRate(2.10), 120);

        assert($outcome === IncidentStatus::REPAIR_FAILED, 'Recurrent burst must transition to REPAIR_FAILED');
        assert($ticket->status === IncidentStatus::REPAIR_FAILED);
        assert(str_contains($ticket->repairNotes, 'Flow recurrent at 2.1 L/min'));
    }
}