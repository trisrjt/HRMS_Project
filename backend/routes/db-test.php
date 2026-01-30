<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use App\Models\User;

Route::get('/test-db', function () {
    try {
        // Check Users Table
        $userCount = User::count();
        $users = User::all(['id', 'email', 'name', 'is_active', 'role_id']);

        $dbName = DB::connection()->getDatabaseName();

        return response()->json([
            'status' => 'success',
            'message' => 'Database Query Successful',
            'db_name' => $dbName,
            'user_count' => $userCount,
            'users' => $users,
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
});
