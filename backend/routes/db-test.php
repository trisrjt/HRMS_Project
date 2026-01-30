<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;

Route::get('/test-db', function () {
    $results = [];
    $host = env('DB_HOST');
    $db = env('DB_DATABASE');
    $user = env('DB_USERNAME');
    $pass = env('DB_PASSWORD');
    $caPath = env('MYSQL_ATTR_SSL_CA', '/usr/local/share/ca-certificates/tidb-ca.crt');

    // Check CA File
    $results['ca_file_path'] = $caPath;
    $results['ca_file_exists'] = file_exists($caPath);
    $results['ca_file_size'] = file_exists($caPath) ? filesize($caPath) : 0;

    // Check standard CA path too
    $systemCa = '/etc/ssl/certs/ca-certificates.crt';

    // Debug Environment
    $results['env_check'] = [
        'host' => $host,
        'user' => $user,
        'pass_len' => strlen($pass),
        'ca_path_from_env' => $caPath,
    ];

    $strategies = [
        'system_ca_verify_true' => [
            PDO::MYSQL_ATTR_SSL_CA => $systemCa,
            PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => true,
        ],
        'system_ca_verify_false' => [
            PDO::MYSQL_ATTR_SSL_CA => $systemCa,
            PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false,
        ],
        'downloaded_ca_verify_true' => [
            PDO::MYSQL_ATTR_SSL_CA => '/usr/local/share/ca-certificates/tidb-ca.crt',
            PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => true,
        ],
        'downloaded_ca_verify_false' => [
            PDO::MYSQL_ATTR_SSL_CA => '/usr/local/share/ca-certificates/tidb-ca.crt',
            PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false,
        ],
    ];

    foreach ($strategies as $name => $options) {
        try {
            // Create New PDO manually to test independent of Laravel Config
            $dsn = "mysql:host={$host};port=4000;dbname={$db};charset=utf8mb4";
            $pdo = new PDO($dsn, $user, $pass, $options);

            $results['strategies'][$name] = [
                'status' => 'success',
                'message' => 'Connected!',
                'server_info' => $pdo->getAttribute(PDO::ATTR_SERVER_INFO),
            ];
        } catch (\Exception $e) {
            $results['strategies'][$name] = [
                'status' => 'error',
                'message' => $e->getMessage(),
            ];
        }
    }

    // Also check Laravel's Native Connection
    try {
        DB::connection()->getPdo();
        $results['laravel_connection'] = 'success';
    } catch (\Exception $e) {
        $results['laravel_connection'] = 'error: ' . $e->getMessage();
    }

    return response()->json($results);
});
