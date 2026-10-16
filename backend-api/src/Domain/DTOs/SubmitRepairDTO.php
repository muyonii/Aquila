<?php
declare(strict_types=1);

namespace Aquila\Domain\DTOs;

readonly class SubmitRepairDTO
{
    public function __construct(
        public string $incidentId,
        public string $repairNotes
    ) {}

    public static function fromArray(string $incidentId, array $body): self
    {
        return new self(
            incidentId: $incidentId,
            repairNotes: trim((string)($body['repair_notes'] ?? ''))
        );
    }
}
