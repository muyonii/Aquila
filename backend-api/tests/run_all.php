<?php
declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use Aquila\Config\Env;
Env::load(); // Load environment

// Register test files
$testFiles = [
    Aquila\Tests\Unit\Utils\UuidTest::class                            => __DIR__ . '/Unit/Utils/UuidTest.php',
    Aquila\Tests\Unit\Entities\HourlySummaryTest::class                => __DIR__ . '/Unit/Entities/HourlySummaryTest.php',
    Aquila\Tests\Unit\ValueObjects\FlowRateTest::class                 => __DIR__ . '/Unit/ValueObjects/FlowRateTest.php',
    Aquila\Tests\Unit\ValueObjects\ConsumptionVolumeTest::class       => __DIR__ . '/Unit/ValueObjects/ConsumptionVolumeTest.php',
    Aquila\Tests\Unit\Entities\IncidentTicketTest::class              => __DIR__ . '/Unit/Entities/IncidentTicketTest.php',
    Aquila\Tests\Unit\Services\RepairVerificationServiceTest::class   => __DIR__ . '/Unit/Services/RepairVerificationServiceTest.php'
];

echo "===============================================================\n";
echo " AQUILA BACKEND CORE DOMAIN TEST SUITE\n";
echo "===============================================================\n";

$totalTests = 0;
$passedTests = 0;
$failedTests = 0;

foreach ($testFiles as $className => $filePath) {
    require_once $filePath;
    $instance = new $className();
    $methods = get_class_methods($instance);

    $testMethods = array_filter($methods, fn($m) => str_starts_with($m, 'test'));

    foreach ($testMethods as $method) {
        $totalTests++;
        $testName = "{$className}::{$method}";
        try {
            $instance->$method();
            $passedTests++;
            echo sprintf("  ✅ [PASS] %s\n", $testName);
        } catch (\Throwable $e) {
            $failedTests++;
            echo sprintf("  ❌ [FAIL] %s\n", $testName);
            echo sprintf("      ↳ Error: %s in %s:%d\n", $e->getMessage(), $e->getFile(), $e->getLine());
        }
    }
}

echo "===============================================================\n";
echo sprintf("RESULTS: Total: %d | Passed: %d | Failed: %d\n", $totalTests, $passedTests, $failedTests);
echo "===============================================================\n";

exit($failedTests === 0 ? 0 : 1);