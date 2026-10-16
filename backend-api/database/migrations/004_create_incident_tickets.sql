-- 3. Incident Work Orders & State Machine
CREATE TABLE IF NOT EXISTS INCIDENT_TICKET (
    incident_id VARCHAR(36) PRIMARY KEY, -- Canonical UUIDv4
    node_id VARCHAR(20) NOT NULL,
    incident_type ENUM('CRITICAL_LEAK', 'FAIRNESS_DEFICIT', 'SUSPICIOUS_USAGE') NOT NULL,
    severity_level ENUM('P1', 'P2', 'P3') NOT NULL,
    action_card_title VARCHAR(100) NULL,
    action_directive TEXT NULL,
    detected_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP NULL,
    pending_verification_since TIMESTAMP NULL,
    resolved_at TIMESTAMP NULL,
    assigned_technician_id INT UNSIGNED NULL,
    status ENUM('OPEN', 'DISPATCHED', 'PENDING_VERIFICATION', 'CLOSED_VERIFIED', 'REPAIR_FAILED', 'CANCELLED') NOT NULL DEFAULT 'OPEN',
    repair_notes TEXT NULL,
    FOREIGN KEY (node_id) REFERENCES MONITORING_NODE(node_id) ON DELETE RESTRICT,
    FOREIGN KEY (assigned_technician_id) REFERENCES USER_ACCOUNT(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;