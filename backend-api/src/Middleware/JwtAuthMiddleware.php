<?php
declare(strict_types=1);

namespace Aquila\Middleware;

use Aquila\Config\Security;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Exception;

class JwtAuthMiddleware
{
    public static function authenticate(): array
    {
        $authHeader = '';

        // 1. Check all standard and rewritten environment keys
        $keys = [
            'HTTP_AUTHORIZATION',
            'REDIRECT_HTTP_AUTHORIZATION',
            'REDIRECT_REDIRECT_HTTP_AUTHORIZATION',
            'HTTP_X_AUTHORIZATION',
            'REDIRECT_HTTP_X_AUTHORIZATION',
            'PHP_AUTH_BEARER',
            'AUTHORIZATION'
        ];

        foreach ($keys as $k) {
            if (!empty($_SERVER[$k])) {
                $authHeader = (string)$_SERVER[$k];
                break;
            }
        }

        // 2. Check getallheaders() / apache_request_headers()
        if (empty($authHeader)) {
            $headers = function_exists('getallheaders') 
                ? getallheaders() 
                : (function_exists('apache_request_headers') ? apache_request_headers() : []);

            foreach ($headers as $key => $val) {
                $lowerKey = strtolower((string)$key);
                if ($lowerKey === 'authorization' || $lowerKey === 'x-authorization') {
                    $authHeader = (string)$val;
                    break;
                }
            }
        }

        // 3. Fallback to apache_getenv if supported
        if (empty($authHeader) && function_exists('apache_getenv')) {
            $authHeader = apache_getenv('HTTP_AUTHORIZATION') 
                ?: (apache_getenv('REDIRECT_HTTP_AUTHORIZATION') ?: '');
        }

        // 4. Validate header presence and Bearer format
        if (empty($authHeader) || !preg_match('/Bearer\s+(\S+)/i', $authHeader, $matches)) {
            http_response_code(401);
            header('Content-Type: application/json');
            echo json_encode([
                "success" => false,
                "error" => [
                    "code" => "UNAUTHORIZED", 
                    "message" => "Missing or malformed Bearer token."
                ]
            ]);
            exit;
        }

        $jwt = $matches[1];

        try {
            $decoded = JWT::decode($jwt, new Key(Security::getJwtSecret(), Security::JWT_ALGORITHM));
            return (array)$decoded->data;
        } catch (Exception $e) {
            http_response_code(401);
            header('Content-Type: application/json');
            echo json_encode([
                "success" => false,
                "error" => ["code" => "TOKEN_INVALID", "message" => "Token is invalid or expired: " . $e->getMessage()]
            ]);
            exit;
        }
    }
}