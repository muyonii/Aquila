-- 1. Infrastructure Monitoring Node Registry (Physical Testbed & Simulated Meters)
CREATE TABLE IF NOT EXISTS `MONITORING_NODE` (
    `node_id` VARCHAR(20) NOT NULL PRIMARY KEY,
    `household_label` VARCHAR(100) NOT NULL,
    `location_name` VARCHAR(255) NOT NULL,
    `purok_cluster` VARCHAR(50) NOT NULL DEFAULT 'Purok 2',
    `parent_node_id` VARCHAR(20) NULL DEFAULT NULL,
    `latitude` DECIMAL(10, 7) NULL DEFAULT NULL,
    `longitude` DECIMAL(10, 7) NULL DEFAULT NULL,
    `is_physical` TINYINT(1) NOT NULL DEFAULT 0,
    `installation_date` DATE NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'FAULT') NOT NULL DEFAULT 'ACTIVE',
    `device_token` VARCHAR(64) NULL DEFAULT NULL,
    `battery_voltage` DECIMAL(4, 2) NULL DEFAULT 4.20,
    `last_heartbeat` DATETIME NULL DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`parent_node_id`) REFERENCES `MONITORING_NODE`(`node_id`) ON DELETE SET NULL,
    INDEX `idx_node_parent` (`parent_node_id`),
    INDEX `idx_node_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;