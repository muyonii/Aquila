-- 4. Incident Work Orders & 15-Minute Repair Verification State Machine
CREATE TABLE IF NOT EXISTS `INCIDENT_TICKET` (
    `incident_id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `node_id` VARCHAR(20) NOT NULL,
    `incident_type` ENUM('CRITICAL_LEAK', 'FAIRNESS_DEFICIT', 'SUSPICIOUS_USAGE') NOT NULL,
    `severity_level` ENUM('P1', 'P2', 'P3') NOT NULL,
    `action_card_title` VARCHAR(100) NULL DEFAULT NULL,
    `action_directive` TEXT NULL DEFAULT NULL,
    `detected_at` DATETIME NOT NULL,
    `verified_at` DATETIME NULL DEFAULT NULL,
    `pending_verification_since` DATETIME NULL DEFAULT NULL,
    `resolved_at` DATETIME NULL DEFAULT NULL,
    `assigned_technician_id` INT UNSIGNED NULL DEFAULT NULL,
    `status` ENUM(
        'OPEN', 
        'DISPATCHED', 
        'PENDING_VERIFICATION', 
        'CLOSED_VERIFIED', 
        'REPAIR_FAILED', 
        'CANCELLED'
    ) NOT NULL DEFAULT 'OPEN',
    `repair_notes` TEXT NULL DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`node_id`) REFERENCES `MONITORING_NODE`(`node_id`) ON DELETE RESTRICT,
    FOREIGN KEY (`assigned_technician_id`) REFERENCES `USER_ACCOUNT`(`user_id`) ON DELETE SET NULL,
    INDEX `idx_ticket_node` (`node_id`),
    INDEX `idx_ticket_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;