<?php
declare(strict_types=1);

namespace Aquila\Tests\Unit\Entities;

use Aquila\Domain\Entities\HourlySummary;

class HourlySummaryTest
{
    public function testInstantiationWithCumulativeMeterReading(): void
    {
        $summary = new HourlySummary(
            summaryId: 101,
            nodeId: 'NODE-B1-002',
            hourTimestamp: '2026-09-28 17:00:00',
            totalVolumeLiters: 42.50,
            peakFlowRateLpm: 3.80,
            leakFlagCount: 1,
            cumulativeMeterReading: 1542.50
        );

        assert($summary->summaryId === 101);
        assert($summary->nodeId === 'NODE-B1-002');
        assert($summary->totalVolumeLiters === 42.50);
        assert($summary->peakFlowRateLpm === 3.80);
        assert($summary->leakFlagCount === 1);
        assert($summary->cumulativeMeterReading === 1542.50);
    }

    public function testFromArrayFactoryHydration(): void
    {
        $row = [
            'summary_id'               => '55',
            'node_id'                  => 'NODE-B1-003',
            'hour_timestamp'           => '2026-09-28 18:00:00',
            'total_volume_liters'      => '12.80',
            'peak_flow_rate_lpm'       => '2.10',
            'leak_flag_count'          => '0',
            'cumulative_meter_reading' => '2450.80'
        ];

        $summary = HourlySummary::fromArray($row);

        assert($summary->summaryId === 55);
        assert($summary->nodeId === 'NODE-B1-003');
        assert($summary->totalVolumeLiters === 12.80);
        assert($summary->cumulativeMeterReading === 2450.80);
    }

    public function testDefaultFallbackWhenCumulativeReadingOmitted(): void
    {
        $row = [
            'summary_id'          => 12,
            'node_id'             => 'NODE-B1-004',
            'hour_timestamp'      => '2026-09-28 19:00:00',
            'total_volume_liters' => 5.0,
            'peak_flow_rate_lpm'  => 1.0,
            'leak_flag_count'     => 0
        ];

        $summary = HourlySummary::fromArray($row);
        assert($summary->cumulativeMeterReading === 0.0);
    }
}