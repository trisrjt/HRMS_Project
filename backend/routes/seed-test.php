<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Artisan;

Route::get('/seed-db', function () {
    try {
        // Skip migration to avoid "Table already exists" error
        // Artisan::call('migrate', ['--force' => true]);
        // $migrateOutput = "Skipped migrations to force seeding.";

        // Run Seeder
        Artisan::call('db:seed', ['--force' => true]);
        $seedOutput = Artisan::output();

        return response()->json([
            'status' => 'success',
            'message' => 'Seeding executed successfully',
            'migrate_output' => 'Skipped',
            'seed_output' => $seedOutput,
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => 'Seeding failed: ' . $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
});
