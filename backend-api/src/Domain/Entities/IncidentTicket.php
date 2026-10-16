<?php
declare(strict_types=1);

namespace Aquila\Domain\Entities;

use Aquila\Domain\Enums\IncidentSeverity;
use Aquila\Domain\Enums\IncidentStatus;
use InvalidArgumentException;

class IncidentTicket
{
    public function __construct(
        public readonly string $incidentId,
        public readonly string $nodeId,
        public readonly string $incidentType,
        public readonly IncidentSeverity $severityLevel,
        public readonly string $detectedAt,
        public ?string $verifiedAt = null,
        public ?string $resolvedAt = null,
        public ?int $assignedTechnicianId = null,
        public IncidentStatus $status = IncidentStatus::OPEN,
        public ?string $repairNotes = null,
        public ?string $actionCardTitle = null,
        public ?string $actionDirective = null,
        public ?string $pendingVerificationSince = null
    ) {}

    public function dispatchTo(int $technicianId): void
    {
        if (!$this->status->canTransitionTo(IncidentStatus::DISPATCHED)) {
            throw new InvalidArgumentException("Cannot dispatch ticket from status: {$this->status->value}");
        }
        $this->assignedTechnicianId = $technicianId;
        $this->status = IncidentStatus::DISPATCHED;
    }

    public function submitRepair(string $notes): void
    {
        if (!$this->status->canTransitionTo(IncidentStatus::PENDING_VERIFICATION)) {
            throw new InvalidArgumentException("Cannot submit repair from status: {$this->status->value}");
        }
        $this->repairNotes = ($this->repairNotes ? $this->repairNotes . "\n" : '') . "[Technician Notes]: " . $notes;
        $this->status = IncidentStatus::PENDING_VERIFICATION;
        $this->pendingVerificationSince = date('Y-m-d H:i:s'); // Starts the 15-minute verification countdown
    }

    public function verifySuccess(): void
    {
        $this->status = IncidentStatus::CLOSED_VERIFIED;
        $this->verifiedAt = date('Y-m-d H:i:s');
        $this->resolvedAt = date('Y-m-d H:i:s');
    }

    public function markFailed(string $reason): void
    {
        $this->status = IncidentStatus::REPAIR_FAILED;
        $this->repairNotes .= "\n[Verification Failed]: " . $reason;
    }

    public function cancel(string $reason): void
    {
        if (!$this->status->canTransitionTo(IncidentStatus::CANCELLED)) {
            throw new InvalidArgumentException("Cannot cancel ticket from status: {$this->status->value}");
        }
        $this->status = IncidentStatus::CANCELLED;
        $this->resolvedAt = date('Y-m-d H:i:s');
        $this->repairNotes .= "\n[Ticket Dismissed / False Alarm]: " . $reason;
    }

    public static function fromArray(array $row): self
    {
        return new self(
            incidentId: (string)$row['incident_id'],
            nodeId: (string)$row['node_id'],
            incidentType: (string)$row['incident_type'],
            severityLevel: IncidentSeverity::from((string)$row['severity_level']),
            detectedAt: (string)$row['detected_at'],
            verifiedAt: isset($row['verified_at']) ? (string)$row['verified_at'] : null,
            resolvedAt: isset($row['resolved_at']) ? (string)$row['resolved_at'] : null,
            assignedTechnicianId: isset($row['assigned_technician_id']) ? (int)$row['assigned_technician_id'] : null,
            status: IncidentStatus::from((string)$row['status']),
            repairNotes: isset($row['repair_notes']) ? (string)$row['repair_notes'] : null,
            actionCardTitle: isset($row['action_card_title']) ? (string)$row['action_card_title'] : null,
            actionDirective: isset($row['action_directive']) ? (string)$row['action_directive'] : null,
            pendingVerificationSince: isset($row['pending_verification_since']) ? (string)$row['pending_verification_since'] : null
        );
    }
}