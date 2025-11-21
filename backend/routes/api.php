<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Controllers
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\SalaryController;
use App\Http\Controllers\LeaveController;
use App\Http\Controllers\PayslipController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\DesignationController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\RecruitmentController;
use App\Http\Controllers\PerformanceReviewController;
use App\Http\Controllers\SettingController;

// Public route
Route::get('/test', function () {
    return response()->json(['message' => 'API working!']);
});

// Public auth routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {

    // User creation (Super Admin & Admin only)
    Route::post('/users', [UserController::class, 'store']);

Route::post('/employee/temp-register', [AuthController::class, 'createEmployeeUser']);
Route::get('/user', function (Request $request) {
    return $request->user();
});

// =========================
// HR + Admin + SuperAdmin can VIEW employees
// =========================
Route::middleware(['auth:sanctum', 'role:1,2,3'])->group(function () {
    Route::get('/employees', [EmployeeController::class, 'index']);
    Route::get('/employees/{id}', [EmployeeController::class, 'show']);
});

// =========================
// ONLY Admin + SuperAdmin can CREATE / UPDATE / DELETE employee
// =========================
Route::middleware(['auth:sanctum', 'role:1,2'])->group(function () {
    Route::post('/employees', [EmployeeController::class, 'store']);
    Route::put('/employees/{id}', [EmployeeController::class, 'update']);
    Route::delete('/employees/{id}', [EmployeeController::class, 'destroy']);

    // Set employee temp password
    Route::put('/users/{id}/set-temp-password', [UserController::class, 'setTempPassword']);
});
Route::post('/change-password', [UserController::class, 'changePassword']);


    // =====================================
// Attendance — HR/Admin/SuperAdmin
// =====================================
Route::middleware(['auth:sanctum', 'role:1,2,3'])->group(function () {

    // View all attendance
    Route::get('/attendances', [AttendanceController::class, 'index']);

    // View single attendance
    Route::get('/attendances/{id}', [AttendanceController::class, 'show']);

    // Mark attendance manually (Admin/HR)
    Route::post('/attendances', [AttendanceController::class, 'store']);

    // Update disabled but endpoint exists
    Route::put('/attendances/{id}', [AttendanceController::class, 'update']);
});
// =====================================
// ATTENDANCE — EMPLOYEE SELF CHECK-IN / CHECK-OUT
// =====================================
Route::middleware(['auth:sanctum', 'role:4'])->group(function () {

    // Employee check-in
    Route::post('/my-attendance/check-in', [AttendanceController::class, 'employeeCheckIn']);

    // Employee check-out
    Route::post('/my-attendance/check-out', [AttendanceController::class, 'employeeCheckOut']);

    // Employee view own attendance
    Route::get('/my-attendance', [AttendanceController::class, 'myAttendance']);
});

    // Salaries
    Route::get('/salaries', [SalaryController::class, 'index']);
    Route::post('/salaries', [SalaryController::class, 'store']);
    Route::get('/salaries/{id}', [SalaryController::class, 'show']);
    Route::put('/salaries/{id}', [SalaryController::class, 'update']);
    Route::delete('/salaries/{id}', [SalaryController::class, 'destroy']);

    // Leaves
    // =====================================
// EMPLOYEE LEAVE — APPLY + VIEW OWN
// =====================================
Route::middleware(['auth:sanctum', 'role:4'])->group(function () {

    // Employee apply leave
    Route::post('/leaves', [LeaveController::class, 'store']);

    // Employee view own leaves
    Route::get('/my-leaves', [LeaveController::class, 'myLeaves']); // New method we will add
});
// =====================================
// LEAVE MANAGEMENT — HR, Admin, SuperAdmin
// =====================================
Route::middleware(['auth:sanctum', 'role:1,2,3'])->group(function () {

    // View all leaves
    Route::get('/leaves', [LeaveController::class, 'index']);

    // View one leave
    Route::get('/leaves/{id}', [LeaveController::class, 'show']);

    // Approve/Reject
    Route::put('/leaves/{id}', [LeaveController::class, 'update']);
});
Route::middleware(['auth:sanctum', 'role:1,2'])->group(function () {
    Route::delete('/leaves/{id}', [LeaveController::class, 'destroy']);
});



    // Payslips
    Route::get('/payslips', [PayslipController::class, 'index']);
    Route::post('/payslips', [PayslipController::class, 'store']);
    Route::get('/payslips/{id}', [PayslipController::class, 'show']);
    Route::delete('/payslips/{id}', [PayslipController::class, 'destroy']);

    // Departments
    Route::apiResource('departments', DepartmentController::class);

    // Designations
    Route::apiResource('designations', DesignationController::class);

    // Announcements
    Route::apiResource('announcements', AnnouncementController::class);

    // Documents
    Route::get('/documents', [DocumentController::class, 'index']);
    Route::post('/documents', [DocumentController::class, 'store']);
    Route::get('/documents/{id}', [DocumentController::class, 'show']);
    Route::get('/documents/{id}/download', [DocumentController::class, 'download']);
    Route::delete('/documents/{id}', [DocumentController::class, 'destroy']);

    // Recruitment
    Route::apiResource('recruitments', RecruitmentController::class);

    // Performance Reviews
    Route::apiResource('performance-reviews', PerformanceReviewController::class);

    // ======================================
// SETTINGS API
// ======================================

// SuperAdmin + Admin can view
Route::middleware(['role:1,2'])->group(function () {
    Route::get('/settings', [SettingController::class, 'index']);
});

// Only SuperAdmin can update
Route::middleware(['role:1'])->group(function () {
    Route::put('/settings', [SettingController::class, 'update']);
    Route::post('/settings/logo', [SettingController::class, 'uploadLogo']);
});

});

Route::get('/test-admin', function () {
    return "Admin or SuperAdmin allowed.";
})->middleware(['auth:sanctum', 'role:1,2']);