# Hikvision Biometric Integration - Quick Test Script
# Run this to verify your setup is working

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Hikvision Biometric Quick Test" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$baseUrl = "http://127.0.0.1:8000"

# Test 1: Backend is running
Write-Host "[1/5] Testing backend availability..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/test" -Method GET -ErrorAction Stop
    Write-Host "  ✓ Backend is running" -ForegroundColor Green
    Write-Host "    Response: $($response.message)" -ForegroundColor Gray
} catch {
    Write-Host "  ✗ Backend is NOT running" -ForegroundColor Red
    Write-Host "    Start backend with: .\artisan serve --host=0.0.0.0 --port=8000" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Test 2: Webhook endpoint exists
Write-Host "[2/5] Testing webhook endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/hikvision/webhook" -Method POST -Body '{"test": true}' -ContentType "application/json" -ErrorAction Stop
    Write-Host "  ✓ Webhook endpoint responding" -ForegroundColor Green
    Write-Host "    Status: $($response.StatusCode)" -ForegroundColor Gray
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 200) {
        Write-Host "  ✓ Webhook endpoint responding" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Webhook returned status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
    }
}
Write-Host ""

# Test 3: Check recent events
Write-Host "[3/5] Fetching recent device events..." -ForegroundColor Yellow
try {
    $events = Invoke-RestMethod -Uri "$baseUrl/api/hikvision/events?limit=5" -Method GET -ErrorAction Stop
    $eventCount = $events.data.Count
    Write-Host "  ✓ Found $eventCount recent events" -ForegroundColor Green
    
    if ($eventCount -gt 0) {
        Write-Host "    Latest event:" -ForegroundColor Gray
        $latest = $events.data[0]
        Write-Host "      - Device: $($latest.device_id)" -ForegroundColor Gray
        Write-Host "      - User: $($latest.user_id)" -ForegroundColor Gray
        Write-Host "      - Timestamp: $($latest.timestamp)" -ForegroundColor Gray
    } else {
        Write-Host "    ⚠ No events yet - scan on device to generate events" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ✗ Failed to fetch events: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: Check database mappings
Write-Host "[4/5] Checking employee-device mappings..." -ForegroundColor Yellow
$phpPath = "C:\wamp64\bin\php\php8.1.33\php.exe"
$checkMappings = @"
<?php
require 'backend/vendor/autoload.php';
`$app = require_once 'backend/bootstrap/app.php';
`$kernel = `$app->make(Illuminate\Contracts\Console\Kernel::class);
`$kernel->bootstrap();
`$count = DB::table('employees')->whereNotNull('device_user_id')->count();
echo `$count;
"@

try {
    $mappingCount = & $phpPath -r $checkMappings
    if ($mappingCount -gt 0) {
        Write-Host "  ✓ $mappingCount employees mapped to device users" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ No employees mapped yet" -ForegroundColor Yellow
        Write-Host "    Run: UPDATE employees SET device_user_id='XX' WHERE employee_code='EMPXXX';" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠ Could not check mappings" -ForegroundColor Yellow
}
Write-Host ""

# Test 5: Check biometric attendance records
Write-Host "[5/5] Checking biometric attendance records..." -ForegroundColor Yellow
$checkAttendance = @"
<?php
require 'backend/vendor/autoload.php';
`$app = require_once 'backend/bootstrap/app.php';
`$kernel = `$app->make(Illuminate\Contracts\Console\Kernel::class);
`$kernel->bootstrap();
`$count = DB::table('attendances')->whereNotNull('biometric_method')->count();
echo `$count;
"@

try {
    $attendanceCount = & $phpPath -r $checkAttendance
    if ($attendanceCount -gt 0) {
        Write-Host "  ✓ $attendanceCount biometric attendance records found" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ No biometric attendance records yet" -ForegroundColor Yellow
        Write-Host "    Have an employee scan on the device to create records" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠ Could not check attendance records" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Test Complete!" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Ensure frontend is running: npm start (in frontend-react folder)" -ForegroundColor White
Write-Host "2. Login as SuperAdmin" -ForegroundColor White
Write-Host "3. Navigate to: SuperAdmin > Biometric Attendance" -ForegroundColor White
Write-Host "4. Map employees if needed (see SUPERADMIN_BIOMETRIC_GUIDE.md)" -ForegroundColor White
Write-Host "5. Test by scanning face/fingerprint on terminal" -ForegroundColor White
Write-Host ""
Write-Host "Documentation: SUPERADMIN_BIOMETRIC_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
