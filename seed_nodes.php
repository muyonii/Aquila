<?php
require 'backend-api/vendor/autoload.php';

$db = Aquila\Config\Database::getConnection();

$sql = <<<'SQL'
INSERT INTO MONITORING_NODE (
    node_id, household_label, location_name, purok_cluster,
    parent_node_id, latitude, longitude, is_physical,
    installation_date, status, device_token
) VALUES
('NODE-B1-001', 'Household 01 (Physical Testbed)', 'Lot 14 Blk 2, Bougainvillea St., Purok 2', 'Purok 2', NULL, 14.6778, 120.5412, 1, '2026-09-01', 'ACTIVE', 'dev_token_001_secure'),
('NODE-B1-002', 'Household 02 (Santos Family)', 'Lot 18 Blk 2, Rosal Ext., Purok 2', 'Purok 2', 'NODE-B1-001', 14.6772, 120.5422, 0, '2026-09-01', 'ACTIVE', 'dev_token_002_secure'),
('NODE-B1-003', 'Household 03 (Reyes Family)', 'Corner Sampaguita St. & Main Road, Purok 2', 'Purok 2', 'NODE-B1-001', 14.6766, 120.5415, 0, '2026-09-01', 'ACTIVE', 'dev_token_003_secure'),
('NODE-B1-004', 'Household 04 (Cruz Family)', 'Purok 2 Water Terminal Near Daycare', 'Purok 2', 'NODE-B1-002', 14.6761, 120.5430, 0, '2026-09-01', 'ACTIVE', 'dev_token_004_secure'),
('NODE-B1-005', 'Household 05 (Bautista Family)', 'Blk 5 Lot 9, Ilang-Ilang Lane, Purok 2', 'Purok 2', 'NODE-B1-002', 14.6769, 120.5436, 0, '2026-09-01', 'ACTIVE', 'dev_token_005_secure'),
('NODE-B1-006', 'Household 06 (Mendoza Family)', 'Sitio Riverside Tap 1, Purok 2', 'Purok 2', 'NODE-B1-003', 14.6756, 120.5411, 0, '2026-09-01', 'ACTIVE', 'dev_token_006_secure'),
('NODE-B1-007', 'Household 07 (Garcia Family)', 'Sitio Riverside Tap 2, Purok 2', 'Purok 2', 'NODE-B1-003', 14.6750, 120.5421, 0, '2026-09-01', 'ACTIVE', 'dev_token_007_secure'),
('NODE-B1-008', 'Household 08 (Navarro Family)', 'Elevated Ridge Zone A, Purok 2', 'Purok 2', 'NODE-B1-004', 14.6754, 120.5442, 0, '2026-09-01', 'ACTIVE', 'dev_token_008_secure'),
('NODE-B1-009', 'Household 09 (Elevated Perimeter)', 'Elevated Ridge Zone B Terminal, Purok 2', 'Purok 2', 'NODE-B1-004', 14.6748, 120.5452, 0, '2026-09-01', 'ACTIVE', 'dev_token_009_secure'),
('NODE-B1-010', 'Community Health Center Tap', 'Community Health Center Tap, Purok 2', 'Purok 2', 'NODE-B1-005', 14.6742, 120.5460, 0, '2026-09-01', 'ACTIVE', 'dev_token_010_secure')
ON DUPLICATE KEY UPDATE location_name = VALUES(location_name)
SQL;

$db->exec($sql);

echo "All 10 nodes seeded successfully" . PHP_EOL;
