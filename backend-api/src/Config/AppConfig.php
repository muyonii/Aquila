<?php
declare(strict_types=1);

namespace Aquila\Config;

class AppConfig
{
    public const TIMEZONE = 'Asia/Manila';
    public const MYSQL_TIMEZONE = '+08:00';
    
    // -------------------------------------------------------------------------
    // Operational & Hardware Thresholds
    // -------------------------------------------------------------------------
    public const REPAIR_VERIFICATION_SECONDS = 900;       // 15-minute observation window (BR-07)
    public const QUIESCENT_FLOW_FLOOR_LPM    = 0.05;      // Line integrity seal floor
    public const MECHANICAL_SENSOR_FLOOR_LPM = 1.0;       // YF-S201 turbine inertia floor (EXC-02)
    public const LOW_BATTERY_THRESHOLD_VOLTS = 3.35;      // 18650 cell potential alert cutoff
    public const STALE_TELEMETRY_TIMEOUT_SECONDS = 45;    // Node declared offline after 45s of silence
    
    // -------------------------------------------------------------------------
    // Theoretical & Algorithmic Invariants
    // -------------------------------------------------------------------------
    public const RAWLSIAN_RDI_CUTOFF          = 0.70;     // BR-04: OECD 70% community mean
    public const MUNICIPAL_SHORTAGE_FLOOR_LPD = 50.0;     // BR-05: WHO 50 L/household/day drought floor
    public const LEAK_PROBABILITY_THRESHOLD   = 0.40;     // Neyman-Pearson Recall >= 90%
    public const CIRCUIT_BREAKER_TIMEOUT_SECONDS = 30.0;  // FR-DSS-03 fallback threshold
    public const TELEMETRY_TTL_SECONDS        = 7200;     // 2-hour sliding window TTL (INV-04)

    public static function getFirebaseUrl(): string
    {
        return rtrim((string)Env::get(
            'FIREBASE_DATABASE_URL', 
            'https://aquila-system-default-rtdb.asia-southeast1.firebasedatabase.app'
        ), '/');
    }
}