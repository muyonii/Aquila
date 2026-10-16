<?php
declare(strict_types=1);

namespace Aquila\Middleware;

class CorsMiddleware
{
    public static function handle(): void
    {
        // 1. Allow any origin (or configure for strict production domain)
        header("Access-Control-Allow-Origin: *");
        header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
        
        // 2. Allow standard + custom AQUILA authentication & webhook headers
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Authorization, X-Aquila-Signature, X-Aquila-Timestamp, X-Aquila-Internal-Key, X-Requested-With, Accept");
        
        // 3. Expose Content-Disposition so browsers can read the generated filename on CSV exports
        header("Access-Control-Expose-Headers: Content-Disposition, Content-Length, X-Aquila-Timestamp");
        
        // 4. Cache preflight responses for 24 hours (86400s) to reduce network overhead
        header("Access-Control-Max-Age: 86400");

        // 5. Fast-exit on HTTP preflight OPTIONS requests
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }
    }
}