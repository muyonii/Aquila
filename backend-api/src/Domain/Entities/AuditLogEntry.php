<?php
declare(strict_types=1);

namespace Aquila\Domain\Entities;

readonly class AuditLogEntry
{
    public function __construct(
        public ?int $logId,
        public ?string $incidentId, // Nullable to allow login, user, and node audits
        public int $performedBy,
        public string $actionTaken,
        public string $clientIp,
        public ?string $remarks,
        public string $loggedAt
    ) {}

    public static function fromArray(array $row): self
    {
        return new self(
            logId: isset($row['log_id']) ? (int)$row['log_id'] : null,
            incidentId: isset($row['incident_id']) ? (string)$row['incident_id'] : null,
            performedBy: (int)$row['performed_by'],
            actionTaken: (string)$row['action_taken'],
            clientIp: (string)$row['client_ip'],
            remarks: isset($row['remarks']) ? (string)$row['remarks'] : null,
            loggedAt: (string)$row['logged_at']
        );
    }
}