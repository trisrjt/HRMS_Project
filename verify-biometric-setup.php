#!/usr/bin/env php
<?php
/**
 * Hikvision Biometric Integration - Verification Script
 * 
 * Run this script to verify that all components are properly configured
 * Usage: php verify-biometric-setup.php
 */

echo "\n";
echo "==============================================\n";
echo "  Hikvision Biometric Integration Verification\n";
echo "==============================================\n\n";

// Change to backend directory
chdir(__DIR__ . '/backend');

// Load Laravel
require __DIR__ . '/backend/vendor/autoload.php';
$app = require_once __DIR__ . '/backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "✓ Laravel application loaded\n\n";

// Check 1: Database Connection
echo "[1/8] Checking database connection...\n";
try {
    DB::connection()->getPdo();
    echo "  ✓ Database connected\n\n";
} catch (\Exception $e) {
    echo "  ✗ Database connection failed: " . $e->getMessage() . "\n\n";
    exit(1);
}

// Check 2: Migrations
echo "[2/8] Checking required tables and columns...\n";
$checks = [
    ['employees', 'device_user_id'],
    ['attendances', 'biometric_method'],
    ['attendances', 'face_snapshot_url'],
    ['attendances', 'device_event_id'],
    ['attendances', 'device_metadata'],
    ['users', 'permissions'],
];

foreach ($checks as [$table, $column]) {
    try {
        $exists = DB::select("SHOW COLUMNS FROM $table LIKE '$column'");
        if (empty($exists)) {
            echo "  ✗ Column $table.$column NOT FOUND - Run migrations!\n";
        } else {
            echo "  ✓ Column $table.$column exists\n";
        }
    } catch (\Exception $e) {
        echo "  ✗ Error checking $table.$column: " . $e->getMessage() . "\n";
    }
}
echo "\n";

// Check 3: Environment Variables
echo "[3/8] Checking environment configuration...\n";
$envVars = [
    'HIKVISION_DEVICE_IP',
    'HIKVISION_DEVICE_LATITUDE',
    'HIKVISION_DEVICE_LONGITUDE',
    'HIKVISION_DEVICE_USER',
];

foreach ($envVars as $var) {
    $value = env($var);
    if ($value) {
        echo "  ✓ $var = $value\n";
    } else {
        echo "  ⚠ $var not set (may be optional)\n";
    }
}
echo "\n";

// Check 4: Controllers Exist
echo "[4/8] Checking controller files...\n";
$controllers = [
    'app/Http/Controllers/HikvisionController.php',
    'app/Http/Controllers/SuperAdminBiometricController.php',
];

foreach ($controllers as $file) {
    if (file_exists(__DIR__ . '/backend/' . $file)) {
        echo "  ✓ $file exists\n";
    } else {
        echo "  ✗ $file NOT FOUND\n";
    }
}
echo "\n";

// Check 5: Routes Registered
echo "[5/8] Checking API routes...\n";
$routes = [
    '/api/hikvision/webhook',
    '/api/superadmin/biometric/attendance',
    '/api/superadmin/biometric/grant-access',
];

foreach ($routes as $route) {
    $found = false;
    foreach (Route::getRoutes() as $r) {
        if ($r->uri() === ltrim($route, '/')) {
            $found = true;
            break;
        }
    }
    
    if ($found) {
        echo "  ✓ Route $route registered\n";
    } else {
        echo "  ✗ Route $route NOT FOUND\n";
    }
}
echo "\n";

// Check 6: Employee Mappings
echo "[6/8] Checking employee device mappings...\n";
$mappedCount = DB::table('employees')->whereNotNull('device_user_id')->count();
if ($mappedCount > 0) {
    echo "  ✓ $mappedCount employees mapped to device users\n";
    
    // Show first 5 mappings
    $mappings = DB::table('employees')
        ->whereNotNull('device_user_id')
        ->select('employee_code', 'device_user_id', 'first_name', 'last_name')
        ->limit(5)
        ->get();
    
    echo "  Examples:\n";
    foreach ($mappings as $m) {
        echo "    - {$m->employee_code}: device_user_id={$m->device_user_id} ({$m->first_name} {$m->last_name})\n";
    }
} else {
    echo "  ⚠ No employees mapped yet - Map employees using device_user_id column\n";
}
echo "\n";

// Check 7: Storage Directories
echo "[7/8] Checking storage directories...\n";
$dirs = [
    'storage/app/public/biometric_snapshots',
    'storage/app/public/reports',
    'storage/logs',
];

foreach ($dirs as $dir) {
    $fullPath = __DIR__ . '/backend/' . $dir;
    if (is_dir($fullPath)) {
        if (is_writable($fullPath)) {
            echo "  ✓ $dir exists and writable\n";
        } else {
            echo "  ⚠ $dir exists but NOT WRITABLE\n";
        }
    } else {
        echo "  ⚠ $dir does not exist (will be created on first use)\n";
    }
}
echo "\n";

// Check 8: Biometric Attendance Records
echo "[8/8] Checking biometric attendance records...\n";
$biometricCount = DB::table('attendances')->whereNotNull('biometric_method')->count();
if ($biometricCount > 0) {
    echo "  ✓ $biometricCount biometric attendance records found\n";
    
    $methods = DB::table('attendances')
        ->whereNotNull('biometric_method')
        ->selectRaw('biometric_method, COUNT(*) as count')
        ->groupBy('biometric_method')
        ->get();
    
    echo "  Breakdown:\n";
    foreach ($methods as $method) {
        echo "    - {$method->biometric_method}: {$method->count}\n";
    }
    
    $withSnapshots = DB::table('attendances')->whereNotNull('face_snapshot_url')->count();
    echo "  ✓ $withSnapshots records have face snapshots\n";
} else {
    echo "  ⚠ No biometric attendance records yet - Test by scanning on device\n";
}
echo "\n";

// Summary
echo "==============================================\n";
echo "  Verification Complete!\n";
echo "==============================================\n\n";

echo "Next Steps:\n";
echo "1. Map employees to device users if not done\n";
echo "2. Test by having employee scan face/fingerprint on terminal\n";
echo "3. Login as SuperAdmin and visit: /superadmin/biometric-attendance\n";
echo "4. Verify attendance record appears with face snapshot\n\n";

echo "Need help? Check SUPERADMIN_BIOMETRIC_GUIDE.md\n\n";
