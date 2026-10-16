<?php
declare(strict_types=1);

namespace Aquila\Domain\DTOs;

readonly class CreateIncidentDTO
{
    public function __construct(
        public string $nodeId,
        public string $incidentType,
        public string $severityLevel,
        public array $recommendation,
        public ?string $incidentId = null
    ) {}

    public static function fromArray(array $payload): self
    {
        return new self(
            nodeId: (string)($payload['node_id'] ?? ''),
            incidentType: (string)($payload['incident_type'] ?? 'CRITICAL_LEAK'),
            severityLevel: (string)($payload['severity_level'] ?? 'P1'),
            recommendation: (array)($payload['recommendation'] ?? []),
            incidentId: isset($payload['incident_id']) ? (string)$payload['incident_id'] : null
        );
    }
}
