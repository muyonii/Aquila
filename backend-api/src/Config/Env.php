<?php
declare(strict_types=1);

namespace Aquila\Config;

class Env
{
    private static bool $loaded = false;

    public static function load(?string $filePath = null): void
    {
        if (self::$loaded && $filePath === null) {
            return;
        }

        // 1. Dual-Path Resolution: check root project folder, then fallback to backend-api folder
        $path = $filePath;
        if ($path === null) {
            $rootPath = dirname(__DIR__, 3) . '/.env';
            $apiPath  = dirname(__DIR__, 2) . '/.env';
            
            if (file_exists($rootPath) && is_readable($rootPath)) {
                $path = $rootPath;
            } elseif (file_exists($apiPath) && is_readable($apiPath)) {
                $path = $apiPath;
            }
        }

        if ($path === null || !file_exists($path) || !is_readable($path)) {
            self::$loaded = true;
            return;
        }

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#')) {
                continue;
            }

            if (str_contains($line, '=')) {
                [$key, $val] = explode('=', $line, 2);
                $key = trim($key);
                $val = trim($val);

                // Strip surrounding single or double quotes
                if ((str_starts_with($val, '"') && str_ends_with($val, '"')) ||
                    (str_starts_with($val, "'") && str_ends_with($val, "'"))) {
                    $val = substr($val, 1, -1);
                }

                // Populate all three PHP environment registries
                putenv("{$key}={$val}");
                $_ENV[$key] = $val;
                $_SERVER[$key] = $val;
            }
        }

        self::$loaded = true;
    }

    public static function get(string $key, ?string $default = null): ?string
    {
        self::load();
        
        // Multi-registry inspection (getenv -> $_ENV -> $_SERVER)
        $val = getenv($key);
        if ($val !== false && $val !== '') {
            return $val;
        }

        if (isset($_ENV[$key]) && $_ENV[$key] !== '') {
            return (string)$_ENV[$key];
        }

        if (isset($_SERVER[$key]) && $_SERVER[$key] !== '') {
            return (string)$_SERVER[$key];
        }

        return $default;
    }
}