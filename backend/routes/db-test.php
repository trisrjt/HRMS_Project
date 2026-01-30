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

    // Strategies to try
    $strategies = [
        'default_with_verify_false' => [
            PDO::MYSQL_ATTR_SSL_CA => $caPath,
            PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false,
        ],
        'default_with_verify_true' => [
            PDO::MYSQL_ATTR_SSL_CA => $caPath,
            PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => true,
        ],
        'no_options' => [], // Rely on system CA
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
