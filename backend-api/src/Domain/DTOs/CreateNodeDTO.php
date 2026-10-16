<?php
declare(strict_types=1);

namespace Aquila\Domain\DTOs;

use InvalidArgumentException;

readonly class CreateNodeDTO
{
    public function __construct(
        public ?string $nodeId,
        public string $householdLabel,
        public string $locationName,
        public string $purokCluster,
        public ?string $parentNodeId,
        public ?float $latitude,
        public ?float $longitude,
        public bool $isPhysical
    ) {}

    public static function fromArray(array $data): self
    {
        $label = trim((string)($data['household_label'] ?? ''));
        if (empty($label)) {
            throw new InvalidArgumentException("household_label is required.");
        }

        $location = trim((string)($data['location_name'] ?? ''));
        if (empty($location)) {
            throw new InvalidArgumentException("location_name (physical street address / tap landmark) is required.");
        }

        return new self(
            nodeId: !empty($data['node_id']) ? trim((string)$data['node_id']) : null,
            householdLabel: $label,
            locationName: $location,
            purokCluster: trim((string)($data['purok_cluster'] ?? 'Purok 2')),
            parentNodeId: !empty($data['parent_node_id']) ? trim((string)$data['parent_node_id']) : null,
            latitude: isset($data['latitude']) ? (float)$data['latitude'] : null,
            longitude: isset($data['longitude']) ? (float)$data['longitude'] : null,
            isPhysical: (bool)($data['is_physical'] ?? false)
        );
    }
}