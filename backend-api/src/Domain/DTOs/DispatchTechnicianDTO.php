<?php
declare(strict_types=1);

namespace Aquila\Domain\DTOs;

readonly class DispatchTechnicianDTO
{
    public function __construct(
        public string $incidentId,
        public int $technicianId
    ) {}

    public static function fromArray(string $incidentId, array $body): self
    {
        return new self(
            incidentId: $incidentId,
            technicianId: (int)($body['technician_id'] ?? 0)
        );
    }
}
