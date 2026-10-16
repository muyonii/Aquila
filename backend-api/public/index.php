<?php
declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use Aquila\Config\Env;
use Aquila\Controllers\AuthController;
use Aquila\Controllers\WebhookController;
use Aquila\Controllers\IncidentController;
use Aquila\Controllers\TaskController;
use Aquila\Controllers\ResidentController;
use Aquila\Controllers\AnalyticsController;
use Aquila\Controllers\NodeController;
use Aquila\Controllers\AuditController;
use Aquila\Controllers\UserController;
use Aquila\Controllers\ReportController;
use Aquila\Middleware\CorsMiddleware;

// 1. Load Environment Configuration
Env::load();

// 2. Global JSON Exception Handler (Guarantees API never leaks raw HTML error text)
set_exception_handler(function (\Throwable $e): void {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        "success" => false,
        "error" => [
            "code"    => "INTERNAL_SERVER_ERROR",
            "message" => $e->getMessage()
        ]
    ], JSON_PRETTY_PRINT);
    exit;
});

// 3. Handle Cross-Origin Resource Sharing (CORS & Preflight OPTIONS)
CorsMiddleware::handle();

// 4. Normalize Request URI and HTTP Method
$rawPath    = (string)parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$requestUri = rtrim($rawPath, '/'); // Strips trailing slashes safely
$method     = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

// =============================================================================
// ROUTE REGISTRY
// =============================================================================

// 1. HEALTH CHECK (Root / Public Base)
if ($method === 'GET' && ($requestUri === '' || str_ends_with($requestUri, '/public') || str_ends_with($requestUri, '/health'))) {
    header('Content-Type: application/json');
    echo json_encode([
        "system"    => "AQUILA Cold Transactional Governance API",
        "version"   => "v2.2.0",
        "status"    => "OPERATIONAL",
        "timestamp" => time()
    ], JSON_PRETTY_PRINT);
    exit;
}

// 2. AUTHENTICATION & IDENTITY
if ($method === 'POST' && str_ends_with($requestUri, '/api/v1/auth/login')) {
    (new AuthController())->login();
    exit;
}
if ($method === 'GET' && str_ends_with($requestUri, '/api/v1/auth/me')) {
    (new AuthController())->getMe();
    exit;
}
if ($method === 'POST' && str_ends_with($requestUri, '/api/v1/auth/change-password')) {
    (new AuthController())->changePassword();
    exit;
}

// 3. USER MANAGEMENT & RBAC
if ($method === 'GET' && str_ends_with($requestUri, '/api/v1/users')) {
    (new UserController())->listUsers();
    exit;
}
if ($method === 'POST' && str_ends_with($requestUri, '/api/v1/users')) {
    (new UserController())->createUser();
    exit;
}
if ($method === 'PUT' && preg_match('#/api/v1/users/(\d+)$#', $requestUri, $matches)) {
    (new UserController())->updateUser((int)$matches[1]);
    exit;
}
if ($method === 'DELETE' && preg_match('#/api/v1/users/(\d+)$#', $requestUri, $matches)) {
    (new UserController())->deleteUser((int)$matches[1]);
    exit;
}

// 4. INFRASTRUCTURE NODES & HYDRAULIC DAG TOPOLOGY
if ($method === 'GET' && str_ends_with($requestUri, '/api/v1/nodes')) {
    (new NodeController())->listNodes();
    exit;
}
if ($method === 'POST' && str_ends_with($requestUri, '/api/v1/nodes')) {
    (new NodeController())->createNode();
    exit;
}
if ($method === 'PUT' && preg_match('#/api/v1/nodes/([a-zA-Z0-9\-]+)$#', $requestUri, $matches)) {
    (new NodeController())->updateNode($matches[1]);
    exit;
}
if ($method === 'DELETE' && preg_match('#/api/v1/nodes/([a-zA-Z0-9\-]+)$#', $requestUri, $matches)) {
    (new NodeController())->deleteNode($matches[1]);
    exit;
}

// 5. INCIDENT TICKETS & DECISION SUPPORT (UC-04)
if ($method === 'GET' && str_ends_with($requestUri, '/api/v1/incidents')) {
    (new IncidentController())->listIncidents();
    exit;
}
if ($method === 'POST' && str_ends_with($requestUri, '/api/v1/incidents')) {
    (new IncidentController())->createManualIncident();
    exit;
}
if ($method === 'GET' && preg_match('#/api/v1/incidents/([a-zA-Z0-9\-]+)$#', $requestUri, $matches)) {
    (new IncidentController())->getIncidentDetails($matches[1]);
    exit;
}
if ($method === 'POST' && preg_match('#/api/v1/incidents/([a-zA-Z0-9\-]+)/dispatch$#', $requestUri, $matches)) {
    (new IncidentController())->dispatchTechnician($matches[1]);
    exit;
}
if ($method === 'PATCH' && preg_match('#/api/v1/incidents/([a-zA-Z0-9\-]+)/cancel$#', $requestUri, $matches)) {
    (new IncidentController())->cancelIncident($matches[1]);
    exit;
}
if ($method === 'POST' && preg_match('#/api/v1/incidents/([a-zA-Z0-9\-]+)/verify-flow$#', $requestUri, $matches)) {
    (new IncidentController())->evaluateVerification($matches[1]);
    exit;
}

// 6. TECHNICIAN FIELD TASKS (UC-05)
if ($method === 'GET' && str_ends_with($requestUri, '/api/v1/tasks')) {
    (new TaskController())->getMyTasks();
    exit;
}
if ($method === 'GET' && preg_match('#/api/v1/tasks/([a-zA-Z0-9\-]+)$#', $requestUri, $matches)) {
    (new TaskController())->getTaskDetails($matches[1]);
    exit;
}
if ($method === 'PATCH' && preg_match('#/api/v1/tasks/([a-zA-Z0-9\-]+)/repair$#', $requestUri, $matches)) {
    (new TaskController())->submitRepair($matches[1]);
    exit;
}

// 7. RESIDENT WATER CONSUMPTION & RLS (UC-01 & RA 10173)
if ($method === 'GET' && str_ends_with($requestUri, '/api/v1/resident/my-water')) {
    (new ResidentController())->getMyWater();
    exit;
}

// 8. CLUSTER ANALYTICS & KPIS
if ($method === 'GET' && str_ends_with($requestUri, '/api/v1/analytics/summary')) {
    (new AnalyticsController())->getClusterSummary();
    exit;
}

// 9. IMMUTABLE AUDIT TRAIL LEDGER (UC-07 & INV-06)
if ($method === 'GET' && str_ends_with($requestUri, '/api/v1/audit-logs')) {
    (new AuditController())->listAuditLogs();
    exit;
}

// 10. REGULATORY & OPERATIONAL REPORTS (UC-08)
if ($method === 'GET' && str_ends_with($requestUri, '/api/v1/reports/consumption')) {
    (new ReportController())->getConsumptionReport();
    exit;
}
if ($method === 'GET' && str_ends_with($requestUri, '/api/v1/reports/leaks')) {
    (new ReportController())->getLeakLossReport();
    exit;
}
if ($method === 'GET' && str_ends_with($requestUri, '/api/v1/reports/maintenance')) {
    (new ReportController())->getMaintenanceReport();
    exit;
}
if ($method === 'GET' && str_ends_with($requestUri, '/api/v1/reports/export')) {
    (new ReportController())->exportCsv();
    exit;
}

// 11. AGENT WEBHOOK INGESTION (HMAC-SHA256)
if ($method === 'POST' && str_ends_with($requestUri, '/api/v1/webhooks/incident')) {
    (new WebhookController())->handleIncident();
    exit;
}

// 12. 404 CATCH-ALL FOR UNMATCHED ROUTES
http_response_code(404);
header('Content-Type: application/json');
echo json_encode([
    "success" => false,
    "error" => [
        "code"    => "ROUTE_NOT_FOUND",
        "message" => "The requested endpoint '{$rawPath}' does not exist on this server."
    ]
], JSON_PRETTY_PRINT);
exit;