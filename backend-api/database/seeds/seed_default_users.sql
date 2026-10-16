USE aquila_db;

-- Default User Accounts (Bcrypt hash for Password123!: $2y$10$Q7iW8vWp... or generated via PHP)
INSERT INTO USER_ACCOUNT (user_id, full_name, email, password_hash, role, assigned_node_id) VALUES
(1, 'BAWASA System Admin', 'admin@bawasa.gov.ph', '$2y$10$TKh8H1.PfQx37YgCzwiKb.KjNyWgaHb9cbcoQgdIVFlYg7B77UdFm', 'admin', NULL),
(2, 'Juan Plumber (Field Tech)', 'technician@bawasa.gov.ph', '$2y$10$TKh8H1.PfQx37YgCzwiKb.KjNyWgaHb9cbcoQgdIVFlYg7B77UdFm', 'technician', NULL),
(3, 'Maria Dela Cruz (Resident)', 'resident1@gmail.com', '$2y$10$TKh8H1.PfQx37YgCzwiKb.KjNyWgaHb9cbcoQgdIVFlYg7B77UdFm', 'resident', 'NODE-B1-001')
ON DUPLICATE KEY UPDATE email = VALUES(email);