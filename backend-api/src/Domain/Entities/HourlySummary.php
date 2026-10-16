<?php
declare(strict_types=1);

namespace Aquila\Domain\Entities;

readonly class HourlySummary
{
    public function __construct(
        public ?int $summaryId,
        public string $nodeId,
        public string $hourTimestamp,
        public float $totalVolumeLiters,
        public float $peakFlowRateLpm,
        public int $leakFlagCount,
        public float $cumulativeMeterReading = 0.0
    ) {}

    public static function fromArray(array $row): self
    {
        return new self(
            summaryId: isset($row['summary_id']) ? (int)$row['summary_id'] : null,
            nodeId: (string)$row['node_id'],
            hourTimestamp: (string)$row['hour_timestamp'],
            totalVolumeLiters: (float)$row['total_volume_liters'],
            peakFlowRateLpm: (float)$row['peak_flow_rate_lpm'],
            leakFlagCount: (int)$row['leak_flag_count'],
            cumulativeMeterReading: isset($row['cumulative_meter_reading']) 
                ? (float)$row['cumulative_meter_reading'] 
                : 0.0
        );
    }
}