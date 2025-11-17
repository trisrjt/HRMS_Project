<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\AttendanceController;

Route::get('/test', function () {
    return response()->json(['message' => 'API working!']);
});

// Public routes (no token required)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes (require Sanctum token)
Route::middleware('auth:sanctum')->group(function () {

    // Employee routes
    Route::get('/employees', [EmployeeController::class, 'index']);
    Route::post('/employees', [EmployeeController::class, 'store']);
    Route::get('/employees/{id}', [EmployeeController::class, 'show']);
    Route::put('/employees/{id}', [EmployeeController::class, 'update']);
    Route::delete('/employees/{id}', [EmployeeController::class, 'destroy']);

    // Attendance routes
    Route::get('/attendances', [AttendanceController::class, 'index']);
    Route::post('/attendances', [AttendanceController::class, 'store']);
    Route::get('/attendances/{id}', [AttendanceController::class, 'show']);
    Route::put('/attendances/{id}', [AttendanceController::class, 'update']);
});

use App\Http\Controllers\SalaryController;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/salaries', [SalaryController::class, 'index']);
    Route::post('/salaries', [SalaryController::class, 'store']);
    Route::get('/salaries/{id}', [SalaryController::class, 'show']);
    Route::put('/salaries/{id}', [SalaryController::class, 'update']);
    Route::delete('/salaries/{id}', [SalaryController::class, 'destroy']);
});
use App\Http\Controllers\LeaveController;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/leaves', [LeaveController::class, 'index']);
    Route::post('/leaves', [LeaveController::class, 'store']);
    Route::get('/leaves/{id}', [LeaveController::class, 'show']);
    Route::put('/leaves/{id}', [LeaveController::class, 'update']);
});


Route::middleware('auth:sanctum')->group(function () {
    Route::get('/leaves', [LeaveController::class, 'index']);
    Route::post('/leaves', [LeaveController::class, 'store']);
    Route::get('/leaves/{id}', [LeaveController::class, 'show']);
    Route::put('/leaves/{id}', [LeaveController::class, 'update']);
    Route::delete('/leaves/{id}', [LeaveController::class, 'destroy']);
});
use App\Http\Controllers\PayslipController;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/payslips', [PayslipController::class, 'index']);
    Route::post('/payslips', [PayslipController::class, 'store']);
    Route::get('/payslips/{id}', [PayslipController::class, 'show']);
    Route::delete('/payslips/{id}', [PayslipController::class, 'destroy']);
});
use App\Http\Controllers\DepartmentController;

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('departments', DepartmentController::class);
});
use App\Http\Controllers\DesignationController;

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('designations', DesignationController::class);
});
use App\Http\Controllers\AnnouncementController;

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('announcements', AnnouncementController::class);
});
use App\Http\Controllers\DocumentController;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/documents', [DocumentController::class, 'index']);
    Route::post('/documents', [DocumentController::class, 'store']);
    Route::get('/documents/{id}', [DocumentController::class, 'show']);
    Route::get('/documents/{id}/download', [DocumentController::class, 'download']);
    Route::delete('/documents/{id}', [DocumentController::class, 'destroy']);
});


Route::middleware('auth:sanctum')->group(function () {
    Route::post('/documents', [DocumentController::class, 'store']);
});
use App\Http\Controllers\RecruitmentController;

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('recruitments', RecruitmentController::class);
});
use App\Http\Controllers\PerformanceReviewController;

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('performance-reviews', PerformanceReviewController::class);
});
use App\Http\Controllers\SettingController;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/settings', [SettingController::class, 'index']);
    Route::put('/settings', [SettingController::class, 'update']);
    Route::post('/settings/logo', [SettingController::class, 'uploadLogo']);
});