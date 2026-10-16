/**
 * AQUILA Infrastructure Node & Hydraulic Topology Registry
 * Matches MySQL `MONITORING_NODE` and `PIPELINE_DAG_EDGE` tables 1:1.
 */
export const TOPOLOGY_NODES = [
    {
        node_id: "NODE-B1-001",
        household_label: "Household 01 (Physical Testbed)",
        location_name: "Lot 14 Blk 2, Bougainvillea St., Purok 2",
        purok_cluster: "Purok 2",
        parent_node_id: null,
        pipe_diameter_mm: 50.0,
        is_physical: true,       // Physical ESP32 Hardware (Simulation skips streaming)
        initial_volume_liters: 1500.0,
        latitude: 14.6778000,
        longitude: 120.5412000
    },
    {
        node_id: "NODE-B1-002",
        household_label: "Household 02 (Santos Family)",
        location_name: "Lot 18 Blk 2, Rosal Ext., Purok 2",
        purok_cluster: "Purok 2",
        parent_node_id: "NODE-B1-001",
        pipe_diameter_mm: 32.0,
        is_physical: false,      // Synthetic Feeder Node
        initial_volume_liters: 200.0,
        latitude: 14.6772000,
        longitude: 120.5422000
    },
    {
        node_id: "NODE-B1-003",
        household_label: "Household 03 (Reyes Family)",
        location_name: "Corner Sampaguita St. & Main Road, Purok 2",
        purok_cluster: "Purok 2",
        parent_node_id: "NODE-B1-001",
        pipe_diameter_mm: 32.0,
        is_physical: false,
        initial_volume_liters: 195.0,
        latitude: 14.6766000,
        longitude: 120.5415000
    },
    {
        node_id: "NODE-B1-004",
        household_label: "Household 04 (Cruz Family)",
        location_name: "Purok 2 Water Terminal Near Daycare",
        purok_cluster: "Purok 2",
        parent_node_id: "NODE-B1-002",
        pipe_diameter_mm: 25.0,
        is_physical: false,
        initial_volume_liters: 175.0,
        latitude: 14.6761000,
        longitude: 120.5430000
    },
    {
        node_id: "NODE-B1-005",
        household_label: "Household 05 (Bautista Family)",
        location_name: "Blk 5 Lot 9, Ilang-Ilang Lane, Purok 2",
        purok_cluster: "Purok 2",
        parent_node_id: "NODE-B1-002",
        pipe_diameter_mm: 25.0,
        is_physical: false,
        initial_volume_liters: 205.0,
        latitude: 14.6769000,
        longitude: 120.5436000
    },
    {
        node_id: "NODE-B1-006",
        household_label: "Household 06 (Mendoza Family)",
        location_name: "Sitio Riverside Tap 1, Purok 2",
        purok_cluster: "Purok 2",
        parent_node_id: "NODE-B1-003",
        pipe_diameter_mm: 25.0,
        is_physical: false,
        initial_volume_liters: 140.0,
        latitude: 14.6756000,
        longitude: 120.5411000
    },
    {
        node_id: "NODE-B1-007",
        household_label: "Household 07 (Garcia Family)",
        location_name: "Sitio Riverside Tap 2, Purok 2",
        purok_cluster: "Purok 2",
        parent_node_id: "NODE-B1-003",
        pipe_diameter_mm: 25.0,
        is_physical: false,
        initial_volume_liters: 135.0,
        latitude: 14.6750000,
        longitude: 120.5421000
    },
    {
        node_id: "NODE-B1-008",
        household_label: "Household 08 (Navarro Family)",
        location_name: "Elevated Ridge Zone A, Purok 2",
        purok_cluster: "Purok 2",
        parent_node_id: "NODE-B1-004",
        pipe_diameter_mm: 20.0,
        is_physical: false,      // Terminal High-Elevation Household
        initial_volume_liters: 185.0,
        latitude: 14.6754000,
        longitude: 120.5442000
    },
    {
        node_id: "NODE-B1-009",
        household_label: "Household 09 (Elevated Perimeter)",
        location_name: "Elevated Ridge Zone B Terminal, Purok 2",
        purok_cluster: "Purok 2",
        parent_node_id: "NODE-B1-004",
        pipe_diameter_mm: 20.0,
        is_physical: false,      // Terminal High-Elevation Household
        initial_volume_liters: 175.0,
        latitude: 14.6748000,
        longitude: 120.5452000
    },
    {
        node_id: "NODE-B1-010",
        household_label: "Community Health Center Tap",
        location_name: "Community Health Center Tap, Purok 2",
        purok_cluster: "Purok 2",
        parent_node_id: "NODE-B1-005",
        pipe_diameter_mm: 20.0,
        is_physical: false,      // Public Facility Tap
        initial_volume_liters: 165.0,
        latitude: 14.6742000,
        longitude: 120.5460000
    }
];