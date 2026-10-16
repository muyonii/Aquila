/**
 * AQUILA System Algorithmic & Operational Thresholds
 * Mirrors backend AppConfig.php, .env, and MAS contracts
 */
export const THRESHOLDS = {
  // Operational Timers
  TELEMETRY_INTERVAL_SECONDS: 15,
  REPAIR_VERIFICATION_SECONDS: 900, // 15 minutes (BR-07)
  CIRCUIT_BREAKER_TIMEOUT_SECONDS: 30.0, // Watchdog liveness (FR-DSS-03)
  STALE_TELEMETRY_TIMEOUT_SECONDS: 45,

  // Fluid Dynamics Floors
  QUIESCENT_FLOW_FLOOR_LPM: 0.05,     // Verification seal floor
  MECHANICAL_SENSOR_FLOOR_LPM: 1.0,   // YF-S201 inertia floor (EXC-02)

  // Power & Battery
  LOW_BATTERY_THRESHOLD_VOLTS: 3.35,  // 18650 cutoff

  // Rawlsian Equity & Shortage
  RAWLSIAN_RDI_CUTOFF: 0.70,          // 70% community mean (BR-04)
  MUNICIPAL_SHORTAGE_FLOOR_LPD: 50.0  // 50 L/household/day (BR-05)
};