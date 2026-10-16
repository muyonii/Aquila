USE `aquila_db`;

-- 1 Physical Testbed Node + 8 Initial Synthetic Community Nodes with Addresses & GPS
INSERT INTO `MONITORING_NODE` 
(`node_id`, `household_label`, `location_name`, `purok_cluster`, `parent_node_id`, `latitude`, `longitude`, `is_physical`, `installation_date`, `status`, `device_token`) VALUES
('NODE-B1-001', 'Household 01 (Physical Testbed)', 'Lot 14 Blk 2, Bougainvillea St., Purok 2', 'Purok 2', NULL,          14.6778000, 120.5412000, 1, '2026-09-01', 'ACTIVE', 'dev_token_001_secure'),
('NODE-B1-002', 'Household 02 (Santos Family)',     'Lot 18 Blk 2, Rosal Ext., Purok 2',          'Purok 2', 'NODE-B1-001', 14.6772000, 120.5422000, 0, '2026-09-01', 'ACTIVE', 'dev_token_002_secure'),
('NODE-B1-003', 'Household 03 (Reyes Family)',      'Corner Sampaguita St. & Main Road, Purok 2', 'Purok 2', 'NODE-B1-001', 14.6766000, 120.5415000, 0, '2026-09-01', 'ACTIVE', 'dev_token_003_secure'),
('NODE-B1-004', 'Household 04 (Cruz Family)',       'Purok 2 Water Terminal Near Daycare',        'Purok 2', 'NODE-B1-002', 14.6761000, 120.5430000, 0, '2026-09-01', 'ACTIVE', 'dev_token_004_secure'),
('NODE-B1-005', 'Household 05 (Bautista Family)',   'Blk 5 Lot 9, Ilang-Ilang Lane, Purok 2',    'Purok 2', 'NODE-B1-002', 14.6769000, 120.5436000, 0, '2026-09-01', 'ACTIVE', 'dev_token_005_secure'),
('NODE-B1-006', 'Household 06 (Mendoza Family)',    'Sitio Riverside Tap 1, Purok 2',            'Purok 2', 'NODE-B1-003', 14.6756000, 120.5411000, 0, '2026-09-01', 'ACTIVE', 'dev_token_006_secure'),
('NODE-B1-007', 'Household 07 (Garcia Family)',     'Sitio Riverside Tap 2, Purok 2',            'Purok 2', 'NODE-B1-003', 14.6750000, 120.5421000, 0, '2026-09-01', 'ACTIVE', 'dev_token_007_secure'),
('NODE-B1-008', 'Household 08 (Navarro Family)',    'Elevated Ridge Zone A, Purok 2',             'Purok 2', 'NODE-B1-004', 14.6754000, 120.5442000, 0, '2026-09-01', 'ACTIVE', 'dev_token_008_secure'),
('NODE-B1-009', 'Household 09 (Elevated Perimeter)','Elevated Ridge Zone B Terminal, Purok 2',    'Purok 2', 'NODE-B1-004', 14.6748000, 120.5452000, 0, '2026-09-01', 'ACTIVE', 'dev_token_009_secure')
ON DUPLICATE KEY UPDATE `household_label` = VALUES(`household_label`), `location_name` = VALUES(`location_name`);

-- Seed DAG edges between nodes
INSERT INTO `PIPELINE_DAG_EDGE` (`upstream_node_id`, `downstream_node_id`, `pipe_diameter_mm`) VALUES
('NODE-B1-001', 'NODE-B1-002', 32.00),
('NODE-B1-001', 'NODE-B1-003', 32.00),
('NODE-B1-002', 'NODE-B1-004', 25.00),
('NODE-B1-002', 'NODE-B1-005', 25.00),
('NODE-B1-003', 'NODE-B1-006', 25.00),
('NODE-B1-003', 'NODE-B1-007', 25.00),
('NODE-B1-004', 'NODE-B1-008', 20.00),
('NODE-B1-004', 'NODE-B1-009', 20.00)
ON DUPLICATE KEY UPDATE `pipe_diameter_mm` = VALUES(`pipe_diameter_mm`);