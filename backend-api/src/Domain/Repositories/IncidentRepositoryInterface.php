<?php
declare(strict_types=1);

namespace Aquila\Domain\Repositories;

use Aquila\Domain\Entities\IncidentTicket;

interface IncidentRepositoryInterface
{
    public function findById(string $incidentId): ?IncidentTicket;
    public function findActiveByNodeId(string $nodeId): ?IncidentTicket;
    public function save(IncidentTicket $incident): void;
    public function findAll(): array;
}