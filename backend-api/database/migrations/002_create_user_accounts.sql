-- 2. User Accounts & 3-Tier RBAC with RA 10173 Tenant Privacy Isolation
CREATE TABLE IF NOT EXISTS `USER_ACCOUNT` (
    `user_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `first_name` VARCHAR(50) NOT NULL,
    `middle_name` VARCHAR(50) NULL DEFAULT NULL,
    `last_name` VARCHAR(50) NOT NULL,
    `full_name` VARCHAR(155) GENERATED ALWAYS AS (
        TRIM(CONCAT(`first_name`, ' ', COALESCE(CONCAT(`middle_name`, ' '), ''), `last_name`))
    ) STORED,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `phone_number` VARCHAR(30) NULL DEFAULT NULL,
    `emergency_contact` VARCHAR(150) NULL DEFAULT NULL,
    `role` ENUM('admin', 'technician', 'resident') NOT NULL DEFAULT 'resident',
    `assigned_node_id` VARCHAR(20) NULL DEFAULT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`assigned_node_id`) REFERENCES `MONITORING_NODE`(`node_id`) ON DELETE SET NULL,
    INDEX `idx_user_role` (`role`),
    INDEX `idx_user_fullname` (`full_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;