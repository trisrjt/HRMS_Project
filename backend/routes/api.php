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

use App\Http\Controllers\RecruitmentController;
use App\Http\Controllers\PerformanceReviewController;
use App\Http\Controllers\SettingController;

// Public route
Route::get('/test', function () {
    return response()->json(['message' => 'API working!']);
});

// DEBUG: Force Password Reset (Delete in Production)
Route::get('/debug-reset/{email}/{password}', function ($email, $password) {
    $user = \App\Models\User::where('email', $email)->first();
    if (!$user) return "User not found";
    $user->password = \Illuminate\Support\Facades\Hash::make($password);
    $user->save();
    return "Password for $email reset to: $password";
});

// Public auth routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/auth/enroll-face', [AuthController::class, 'enrollFace']);
Route::post('/auth/login-face', [AuthController::class, 'loginFace']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {

    // User creation (Super Admin & Admin only)
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);

Route::post('/employee/temp-register', [AuthController::class, 'createEmployeeUser']);
Route::get('/user', [UserController::class, 'me']);

    // Authenticated Attendance History (Controller checks permissions)
    Route::get('/attendance/employee/{id}', [AttendanceController::class, 'employeeHistory']);

// =========================
// HR + Admin + SuperAdmin can VIEW employees
// =========================
// =========================
// HR + Admin + SuperAdmin can VIEW employees
// =========================
Route::middleware(['auth:sanctum', 'role:1,2,3', 'permission:can_view_employees'])->group(function () {
    Route::get('/employees', [EmployeeController::class, 'index']);
    Route::get('/employees/{id}', [EmployeeController::class, 'show']);
});

// =========================
// ONLY Admin + SuperAdmin can CREATE / UPDATE / DELETE employee
// =========================
Route::middleware(['auth:sanctum', 'role:1,2,3', 'permission:can_manage_employees'])->group(function () {
    Route::post('/employees', [EmployeeController::class, 'store']);
    Route::put('/employees/{id}', [EmployeeController::class, 'update']);
    Route::delete('/employees/{id}', [EmployeeController::class, 'destroy']);

    // Set employee temp password
    Route::put('/users/{id}/set-temp-password', [UserController::class, 'setTempPassword']);

    // Toggle Payslip Access
    Route::patch('/employees/{id}/payslip-access', [EmployeeController::class, 'togglePayslipAccess']);
    
    // Toggle overtime permission
    Route::post('/employees/{id}/toggle-overtime', [EmployeeController::class, 'toggleOvertime']);
});
Route::post('/change-password', [AuthController::class, 'changePassword']);


    // =====================================
// Attendance — HR/Admin/SuperAdmin
// =====================================
// Attendance — HR/Admin/SuperAdmin
// =====================================
Route::middleware(['auth:sanctum', 'role:1,2,3'])->group(function () {

    // View (can_view_attendance)
    Route::middleware('permission:can_view_attendance')->group(function() {
        Route::get('/attendances', [AttendanceController::class, 'index']);
        Route::get('/attendances/{id}', [AttendanceController::class, 'show']);
        
        // New grouped attendance routes
        Route::get('/attendance/summary', [AttendanceController::class, 'summary']);
    });

    // Mark/Update (can_manage_attendance)
    Route::middleware('permission:can_manage_attendance')->group(function() {
        Route::post('/attendances', [AttendanceController::class, 'store']);
        Route::put('/attendances/{id}', [AttendanceController::class, 'update']);
        
        // Admin/HR checkout employee
        Route::post('/attendances/{id}/checkout', [AttendanceController::class, 'adminCheckoutEmployee']);
    });
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

    // Get pending checkouts
    Route::get('/my-attendance/pending-checkouts', [AttendanceController::class, 'getPendingCheckouts']);

    // Check out old session
    Route::post('/my-attendance/checkout-old/{id}', [AttendanceController::class, 'checkoutOldSession']);

    // Overtime management
    Route::post('/my-attendance/overtime/start', [AttendanceController::class, 'startOvertime']);
    Route::post('/my-attendance/overtime/end', [AttendanceController::class, 'endOvertime']);
});

    // Salaries
    // ======================================
// SALARY API
// ======================================

    // ======================================
    // EMPLOYEE: OWN SALARY
    // ======================================
    Route::middleware(['role:4'])->group(function () {
        Route::get('/salary/{id}', [SalaryController::class, 'show']);
        Route::get('/my-salary', [SalaryController::class, 'mySalary']);
    });

    // =====================================
    // EMPLOYEE: LEAVES (Apply + View Own)
    // =====================================
    Route::middleware(['auth:sanctum', 'role:4'])->group(function () {
        Route::post('/leaves', [LeaveController::class, 'store']);
        Route::get('/my-leaves', [LeaveController::class, 'myLeaves']);
        Route::get('/my-leaves/balances', [LeaveController::class, 'myBalances']);
        Route::get('/my-leaves/types', [LeaveController::class, 'getApplicableLeaveTypes']); 
        Route::put('/leaves/{id}/withdraw', [LeaveController::class, 'withdraw']);
    });

    // =====================================
    // MANAGER: TEAM VISIBILITY
    // =====================================
    Route::middleware(['auth:sanctum', 'role:4'])->group(function () {
        Route::get('/my-team', [EmployeeController::class, 'myTeam']);
        Route::get('/my-team/attendance', [AttendanceController::class, 'teamAttendance']);
        Route::get('/my-team/leaves', [LeaveController::class, 'teamLeaves']);
    });

    // =====================================
    // LEAVE MANAGEMENT — HR, Admin, SuperAdmin
    // =====================================
    Route::middleware(['auth:sanctum', 'role:1,2,3'])->group(function () {
        // View (Permission logic moved to Controller index/show methods to handle OR case safely)
        Route::middleware([])->group(function() {
            Route::get('/leaves', [LeaveController::class, 'index']);
            Route::get('/leaves/summary', [LeaveController::class, 'summary']); // New
            Route::get('/leaves/export', [LeaveController::class, 'export']);   // New
            Route::get('/leaves/{id}', [LeaveController::class, 'show']);
        });

        // Approve/Reject (Manage)
        Route::middleware('permission:can_manage_leaves')->group(function() {
            Route::put('/leaves/{id}', [LeaveController::class, 'update']);
            Route::put('/leaves/{id}/partial-approve', [LeaveController::class, 'partialApprove']);
        });
    });

    Route::middleware(['auth:sanctum', 'role:1,2'])->group(function () {
        Route::delete('/leaves/{id}', [LeaveController::class, 'destroy']);
    });

    // ======================================
    // PAYROLL POLICY (Unified)
    // ======================================
    // Allow any Admin/HR (Role 1,2,3) to view policy. 
    // This resolves the issue where a Manager (Role 3) with 'can_manage_salaries' but not 'can_view_salaries' gets 403.
    Route::middleware(['role:1,2,3'])->group(function () {
        Route::get('/payroll-policy', [SalaryController::class, 'getPayrollPolicy']);
    });

    // ======================================
    // SALARY API (Unified)
    // ======================================

    // Admin (2) + SuperAdmin (1) + HR (3)
    Route::middleware(['role:1,2,3'])->group(function () {
        // View
        Route::middleware('permission:can_view_salaries')->group(function() {
            Route::get('/salaries', [SalaryController::class, 'index']);
            Route::get('/salaries/export', [SalaryController::class, 'export']); // New
            Route::get('/salaries/history/{id}', [SalaryController::class, 'history']); // New
            Route::get('/salaries/employee/{id}', [SalaryController::class, 'getByEmployee']);
        });

        // Manage (Role 1, 2 only for now, unless HR has explicit permission. Controller handles it)
        Route::middleware('permission:can_manage_salaries')->group(function() {
            Route::post('/salaries', [SalaryController::class, 'store']);
            Route::post('/salaries/update', [SalaryController::class, 'update']); // Support generic update
            Route::put('/salaries/{id}', [SalaryController::class, 'update']);
        });
    });



// ======================================
// PAYSLIP ROUTES
// ======================================

// Payslips - Admin + SuperAdmin + HR
Route::middleware(['role:1,2,3'])->group(function () {
    // View (can_view_salaries covers payslips)
    Route::middleware('permission:can_view_salaries')->group(function() {
        Route::get('/payslips/download', [PayslipController::class, 'download']); // Bulk Download
        Route::get('/payslips', [PayslipController::class, 'index']);      // View all
        Route::get('/payslips/{id}', [PayslipController::class, 'show']);  // View single
    });

    // Manage (can_manage_salaries covers payslips generation)
    Route::middleware('permission:can_manage_salaries')->group(function() {
        Route::post('/payslips', [PayslipController::class, 'store']);     // Generate
        Route::put('/payslips/{id}', [PayslipController::class, 'update']); // Update
        Route::delete('/payslips/{id}', [PayslipController::class, 'destroy']); // Delete
    });
});

// Employee can view OWN payslip only
Route::middleware('role:4')->group(function () {
    Route::get('/payslips/{id}', [PayslipController::class, 'show']);
    Route::get('/my-payslips', [PayslipController::class, 'myPayslips']);
});


    // Departments
    Route::middleware(['role:1,2,3'])->group(function() {
        Route::get('/departments', [DepartmentController::class, 'index']);
        Route::get('/departments/{id}', [DepartmentController::class, 'show']);
    });
    
    Route::middleware(['role:1,2', 'permission:can_manage_departments'])->group(function() {
        Route::post('/departments', [DepartmentController::class, 'store']);
        Route::put('/departments/{id}', [DepartmentController::class, 'update']);
        Route::delete('/departments/{id}', [DepartmentController::class, 'destroy']);
    });

    // Designations
    Route::apiResource('designations', DesignationController::class);

    // Announcements
    Route::post('announcements/upload-file', [AnnouncementController::class, 'uploadFile']);
    Route::post('announcements/{id}/track-view', [AnnouncementController::class, 'trackView']);
    Route::apiResource('announcements', AnnouncementController::class);



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

// SuperAdmin Dashboard Routes
Route::middleware(['auth:sanctum'])->prefix('superadmin')->group(function () {
    Route::get('/stats', [App\Http\Controllers\SuperAdminDashboardController::class, 'stats']);
    Route::get('/activity-log', [App\Http\Controllers\SuperAdminDashboardController::class, 'activityLog']);
    Route::get('/system-health', [App\Http\Controllers\SuperAdminDashboardController::class, 'systemHealth']);
    Route::get('/employee-growth', [App\Http\Controllers\SuperAdminDashboardController::class, 'employeeGrowth']);
    Route::get('/department-distribution', [App\Http\Controllers\SuperAdminDashboardController::class, 'departmentDistribution']);
    Route::get('/attendance-trends', [App\Http\Controllers\SuperAdminDashboardController::class, 'attendanceTrends']);
    Route::get('/today-attendance', [App\Http\Controllers\SuperAdminDashboardController::class, 'todayAttendance']);
    Route::get('/leaves-summary', [App\Http\Controllers\SuperAdminDashboardController::class, 'leavesSummary']);

    // Employee Management (Unified -> See /employees)
    // Attendance Management (Unified -> See /attendance)

    // Department Management
    Route::get('/departments', [App\Http\Controllers\SuperAdminDepartmentController::class, 'index']);
    Route::post('/departments', [App\Http\Controllers\SuperAdminDepartmentController::class, 'store']);
    Route::put('/departments/{id}', [App\Http\Controllers\SuperAdminDepartmentController::class, 'update']);
    Route::delete('/departments/{id}', [App\Http\Controllers\SuperAdminDepartmentController::class, 'destroy']);

    // Leave Management
    Route::get('/leaves', [App\Http\Controllers\SuperAdminLeaveController::class, 'index']);
    Route::get('/leaves/summary', [App\Http\Controllers\SuperAdminLeaveController::class, 'summary']);
    Route::get('/leaves/export', [App\Http\Controllers\SuperAdminLeaveController::class, 'export']);
    Route::post('/leaves/{id}/approve', [App\Http\Controllers\SuperAdminLeaveController::class, 'approve']);
    Route::post('/leaves/{id}/reject', [App\Http\Controllers\SuperAdminLeaveController::class, 'reject']);

    // Salary Management
    Route::get('/salaries', [App\Http\Controllers\SuperAdminSalaryController::class, 'index']);
    Route::get('/salaries/history/{id}', [App\Http\Controllers\SuperAdminSalaryController::class, 'history']);
    Route::post('/salaries/create', [App\Http\Controllers\SuperAdminSalaryController::class, 'create']);
    Route::post('/salaries/update', [App\Http\Controllers\SuperAdminSalaryController::class, 'update']);
    Route::get('/salaries/export', [App\Http\Controllers\SuperAdminSalaryController::class, 'export']);
});

// Notifications Routes
Route::middleware("auth:sanctum")->group(function () {
    Route::get("/notifications", [App\Http\Controllers\NotificationController::class, "index"]);
    Route::get("/notifications/unread-count", [App\Http\Controllers\NotificationController::class, "unreadCount"]);
    Route::post("/notifications/mark-read/{id}", [App\Http\Controllers\NotificationController::class, "markRead"]);
    Route::post("/notifications/mark-all-read", [App\Http\Controllers\NotificationController::class, "markAllRead"]);

    // Admin + SuperAdmin only
    Route::post("/notifications/send", [App\Http\Controllers\NotificationController::class, "send"])
        ->middleware("role:1,2");
});

// Permission Management
Route::middleware(['auth:sanctum', 'role:1'])->group(function () {
    Route::put('/superadmin/users/{id}/permissions', [App\Http\Controllers\PermissionController::class, 'update']);
});

// ======================================
// POLICY MANAGEMENT ROUTES
// ======================================
Route::middleware(['auth:sanctum'])->group(function () {
    
    // Holidays
    Route::get('/holidays', [App\Http\Controllers\HolidayController::class, 'index']); // Public read
    
    // Admin/HR Managed Routes
    Route::middleware(['role:1,2,3'])->group(function () {
        Route::post('/holidays/import', [App\Http\Controllers\HolidayController::class, 'import']); // Import Route
        Route::post('/holidays', [App\Http\Controllers\HolidayController::class, 'store']);
        Route::put('/holidays/{id}', [App\Http\Controllers\HolidayController::class, 'update']);
        Route::delete('/holidays/{id}', [App\Http\Controllers\HolidayController::class, 'destroy']);

        // Leave Policies
        // Leave Policies
        Route::get('/leave-types', [App\Http\Controllers\LeavePolicyController::class, 'getLeaveTypes']);
        Route::get('/leave-policies', [App\Http\Controllers\LeavePolicyController::class, 'index']);
        Route::post('/leave-policies', [App\Http\Controllers\LeavePolicyController::class, 'store']);
        Route::put('/leave-policies/{id}', [App\Http\Controllers\LeavePolicyController::class, 'update']);
        Route::delete('/leave-policies/{id}', [App\Http\Controllers\LeavePolicyController::class, 'destroy']);
        Route::get('/leave-policies/{id}/carry-forward-candidates', [App\Http\Controllers\LeavePolicyController::class, 'getCarryForwardCandidates']);
        Route::post('/leave-policies/{id}/process-carry-forward', [App\Http\Controllers\LeavePolicyController::class, 'processCarryForward']);
        Route::post('/leave-policies/{id}/recalculate', [App\Http\Controllers\LeavePolicyController::class, 'recalculate']);
    });
    
    // Payroll Policies (SuperAdmin/Admin + HR with manage permission)
    Route::middleware(['role:1,2,3'])->group(function () {
        // GET /payroll-policy handled by SalaryController (Unified)
        Route::middleware('permission:can_manage_salaries')->post('/payroll-policy', [App\Http\Controllers\PayrollPolicyController::class, 'update']);
    });
    
    // ======================================
    // EMPLOYEE DOCUMENTS (Unified)
    // ======================================
    Route::get('/employee-documents', [App\Http\Controllers\EmployeeDocumentController::class, 'index']);
    Route::post('/employee-documents', [App\Http\Controllers\EmployeeDocumentController::class, 'store']);
    Route::get('/employee-documents/{id}/download', [App\Http\Controllers\EmployeeDocumentController::class, 'download']);
    Route::delete('/employee-documents/{id}', [App\Http\Controllers\EmployeeDocumentController::class, 'destroy']);
    
});