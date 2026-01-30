<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;

Route::get('/test-db', function () {
    try {
        DB::connection()->getPdo();
        $dbName = DB::connection()->getDatabaseName();
        $tableCount = DB::select("SELECT count(*) as count FROM information_schema.tables WHERE table_schema = ?", [$dbName]);
        return response()->json([
            'status' => 'success',
            'message' => 'Database connection established!',
            'database' => $dbName,
            'table_count' => $tableCount[0]->count ?? 0,
            'ssl_ca' => env('MYSQL_ATTR_SSL_CA'),
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => 'Database connection failed: ' . $e->getMessage(),
            'code' => $e->getCode()
        ], 500);
    }
});
