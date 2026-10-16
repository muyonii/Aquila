<?php
declare(strict_types=1);

namespace Aquila\Tests\Unit\Entities;

use Aquila\Domain\Entities\IncidentTicket;
use Aquila\Domain\Enums\IncidentSeverity;
use Aquila\Domain\Enums\IncidentStatus;
use InvalidArgumentException;

class IncidentTicketTest
{
    private function createTicket(): IncidentTicket
    {
        return new IncidentTicket(
            incidentId: 'test-uuid-001',
            nodeId: 'NODE-B1-002',
            incidentType: 'CRITICAL_LEAK',
            severityLevel: IncidentSeverity::P1,
            detectedAt: '2026-09-28 10:00:00',
            verifiedAt: null,
            resolvedAt: null,
            assignedTechnicianId: null,
            status: IncidentStatus::OPEN,
            repairNotes: null
        );
    }

    public function testNormalLifecycleTransitions(): void
    {
        $ticket = $this->createTicket();
        assert($ticket->status === IncidentStatus::OPEN);

        // 1. Dispatch
        $ticket->dispatchTo(2);
        assert($ticket->status === IncidentStatus::DISPATCHED);
        assert($ticket->assignedTechnicianId === 2);

        // 2. Submit repair -> Pending Verification
        $ticket->submitRepair('Replaced 3/4-inch PVC elbow.');
        assert($ticket->status === IncidentStatus::PENDING_VERIFICATION);
        assert(str_contains($ticket->repairNotes, 'Replaced 3/4-inch PVC elbow'));

        // 3. Verify Success -> Closed Verified
        $ticket->verifySuccess();
        assert($ticket->status === IncidentStatus::CLOSED_VERIFIED);
        assert($ticket->resolvedAt !== null);
    }

    public function testInvalidTransitionThrowsException(): void
    {
        $ticket = $this->createTicket();
        $ticket->verifySuccess(); // Move directly to CLOSED_VERIFIED (terminal)

        try {
            $ticket->dispatchTo(3); // Terminal states cannot transition
            assert(false, 'Dispatching a closed ticket must throw InvalidArgumentException');
        } catch (InvalidArgumentException $e) {
            assert(str_contains($e->getMessage(), 'Cannot dispatch ticket from status'));
        }
    }

    public function testTicketCancellation(): void
    {
        $ticket = $this->createTicket();
        $ticket->cancel('False alarm; resident water hose left running.');
        assert($ticket->status === IncidentStatus::CANCELLED);
        assert($ticket->resolvedAt !== null);
    }
}