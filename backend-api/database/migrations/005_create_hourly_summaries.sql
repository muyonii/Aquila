-- 5. Compacted Hourly Telemetry Archive (CQRS Historical Reporting Layer)
CREATE TABLE IF NOT EXISTS `HOURLY_SUMMARY` (
    `summary_id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `node_id` VARCHAR(20) NOT NULL,
    `hour_timestamp` DATETIME NOT NULL,
    `total_volume_liters` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `peak_flow_rate_lpm` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `leak_flag_count` INT UNSIGNED NOT NULL DEFAULT 0,
    `cumulative_meter_reading` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`node_id`) REFERENCES `MONITORING_NODE`(`node_id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_node_hour` (`node_id`, `hour_timestamp`),
    INDEX `idx_summary_timestamp` (`hour_timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;