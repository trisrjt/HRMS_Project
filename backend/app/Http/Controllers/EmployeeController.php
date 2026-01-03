<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\User;
use App\Models\Salary;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Hash;   
use App\Services\NotificationService;

class EmployeeController extends Controller
{
    protected $notifications;

    public function __construct(NotificationService $notifications)
    {
        $this->notifications = $notifications;
    }
    
    /**
     * Calculate salary breakdown based on payroll policy
     */
    private function calculateSalaryComponents($gross_salary, $pf_opt_out, $esic_opt_out, $ptax_opt_out)
    {
        // 1. Fetch Policy
        $policies = \App\Models\PayrollPolicy::all()->pluck('value', 'key');
        
        $basicPercent = $policies['basic_percentage'] ?? 70;
        // Ensure values are boolean
        $pfEnabled = filter_var($policies['pf_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $esicEnabled = filter_var($policies['esic_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $ptaxEnabled = filter_var($policies['ptax_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN);
        
        $ptaxSlabsVal = $policies['ptax_slabs'] ?? '[]';
        $ptaxSlabs = is_string($ptaxSlabsVal) ? json_decode($ptaxSlabsVal, true) : $ptaxSlabsVal;

        // 2. Calculate Components
        $basic = round(floatval($gross_salary) * ($basicPercent / 100));
        $hra = floatval($gross_salary) - $basic;
        
        // Deductions
        $pf = 0;
        if ($pfEnabled && !$pf_opt_out) {
            $pf = round($basic * 0.12); // PF is 12% of Basic
        }
        
        $esic = 0;
        // ESIC 0.75% of Gross if Gross <= 21000
        if ($esicEnabled && !$esic_opt_out && floatval($gross_salary) <= 21000) {
            $esic = ceil(floatval($gross_salary) * 0.0075);
        }

        $ptax = 0;
        if ($ptaxEnabled && !$ptax_opt_out && is_array($ptaxSlabs)) {
            foreach ($ptaxSlabs as $slab) {
                $min = floatval($slab['min_salary'] ?? 0);
                $maxStr = $slab['max_salary'] ?? null;
                $max = ($maxStr === null || $maxStr === "") ? INF : floatval($maxStr);
                
                if (floatval($gross_salary) >= $min && floatval($gross_salary) <= $max) {
                     $ptax = floatval($slab['tax_amount'] ?? 0);
                     break;
                }
            }
        }
        
        $totalDeductions = $pf + $esic + $ptax;
        
        return [
            'basic' => $basic,
            'hra' => $hra,
            'da' => 0,
            'allowances' => 0,
            'deductions' => $totalDeductions,
            'gross_salary' => $gross_salary
        ];
    }
    // ==============================
    // GET /api/employees
    // ==============================
    public function index()
{
    // Only SuperAdmin (1), Admin (2), HR (3)
    if (!in_array(auth()->user()->role_id, [1, 2, 3])) {
        return response()->json(['message' => 'Unauthorized'], 403);
    }

    $query = Employee::with([
        'department',
        'designation',
        'user:id,name,email,is_active'
    ]);

    // Check permission for salary visibility
    if (auth()->user()->role_id == 1 || auth()->user()->can('can_view_salaries') || auth()->user()->can('can_manage_salaries')) {
        $query->with('currentSalary');
    }

    return $query->orderByDesc('id')->get();
}


    // ==============================
    // POST /api/employees
    // Only Admin (2) and Super Admin (1)
    // Creates employee profile for an existing user
    // ==============================
   public function store(Request $request)
{
    // Only SuperAdmin (1), Admin (2), & HR (3)
    if (!in_array(auth()->user()->role_id, [1, 2, 3])) {
        return response()->json(['message' => 'Unauthorized'], 403);
    }

    // Validate incoming request
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|email|unique:users,email',
        'temp_password' => 'required|min:6',
        'department_id' => 'required|exists:departments,id',
        'designation_name' => 'required|string|max:255', 
        'reports_to' => 'nullable|exists:employees,id',
        'gross_salary' => 'nullable|numeric',  // Changed from salary to gross_salary
        'pf_opt_out' => 'boolean',
        'esic_opt_out' => 'boolean',
        'ptax_opt_out' => 'boolean',
        'phone' => 'nullable|string|max:20',
        'address' => 'nullable|string',
        'date_of_joining' => 'nullable|date',
        'dob' => 'nullable|date', // Added DOB
        'aadhar_number' => 'nullable|digits:12', // Added Aadhar
        'pan_number' => 'nullable|regex:/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i', // Added PAN
        'profile_photo' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
    ]);

    // Handle File Upload
    $profilePhotoPath = null;
    if ($request->hasFile('profile_photo')) {
        $profilePhotoPath = $request->file('profile_photo')->store('employees', 'public');
    }

    // Handle Designation (Hybrid: Select or Create)
    $designationName = trim($request->designation_name);
    $designation = \App\Models\Designation::firstOrCreate(
        ['name' => $designationName],
        ['is_active' => true]
    );

    // Step 1: Create USER
    $user = User::create([
        'name' => $request->name,
        'email' => $request->email,
        'password' => Hash::make($request->temp_password), // hashed
        'temp_password' => $request->temp_password,        // raw temp pass
        'role_id' => 4, // Employee
        'is_active' => true, // Default to Active
    ]);

    // Step 2: Generate employee code
    $employeeCode = 'EMP' . str_pad(Employee::count() + 1, 3, '0', STR_PAD_LEFT);

    // Calculate Salary Components
    $salaryData = [
        'basic' => 0, 'hra' => 0, 'da' => 0, 'allowances' => 0, 
        'deductions' => 0, 'gross_salary' => 0
    ];

    if (auth()->user()->role_id == 1 || auth()->user()->can('can_manage_salaries')) {
        if ($request->gross_salary > 0) {
            $salaryData = $this->calculateSalaryComponents(
                $request->gross_salary,
                $request->boolean('pf_opt_out'),
                $request->boolean('esic_opt_out'),
                $request->boolean('ptax_opt_out')
            );
        }
    }

    // Step 3: Create EMPLOYEE
    $employee = Employee::create([
        'user_id' => $user->id,
        'department_id' => $request->department_id,
        'employee_code' => $employeeCode,
        'designation_id' => $designation->id,
        'reports_to' => $request->reports_to,
        'salary' => $salaryData['gross_salary'],
        'phone' => $request->phone,
        'address' => $request->address,
        'date_of_joining' => $request->date_of_joining,
        'dob' => $request->dob,
        'aadhar_number' => $request->aadhar_number ?? null,
        'pan_number' => $request->pan_number ?? null,
        'profile_photo' => $profilePhotoPath,
        'pf_opt_out' => $request->boolean('pf_opt_out'),
        'esic_opt_out' => $request->boolean('esic_opt_out'),
        'ptax_opt_out' => $request->boolean('ptax_opt_out'),
    ]);

    // Step 3.1: Create Salary Record
    Salary::create([
        'employee_id' => $employee->id,
        'basic' => $salaryData['basic'],
        'hra' => $salaryData['hra'],
        'da' => $salaryData['da'],
        'allowances' => $salaryData['allowances'],
        'deductions' => $salaryData['deductions'],
        'gross_salary' => $salaryData['gross_salary'],
    ]);

    // Create Salary History
    \App\Models\SalaryHistory::create([
        'employee_id' => $employee->id,
        'basic' => $salaryData['basic'],
        'hra' => $salaryData['hra'],
        'da' => $salaryData['da'],
        'allowances' => $salaryData['allowances'],
        'deductions' => $salaryData['deductions'],
        'gross_salary' => $salaryData['gross_salary'],
    ]);

    // Notify HR
    $designationName = $employee->designation ? $employee->designation->name : 'Unknown';
    $this->notifications->sendToRoles(
        [3],
        "New Employee Added",
        "{$user->name} has joined as {$designationName}",
        "hr-action",
        "/hr/employees"
    );

    // Step 4: Response
    return response()->json([
        'message' => 'Employee created successfully',
        'user' => $user,
        'employee' => $employee
    ], 201);
}


    // ==============================
    // GET /api/employees/{id}
    // ==============================
    public function show($id)
{
    if (!in_array(auth()->user()->role_id, [1, 2, 3])) {
        return response()->json(['message' => 'Unauthorized'], 403);
    }

    $query = Employee::with(['department', 'designation', 'manager.user', 'user:id,name,email']);

    if (auth()->user()->role_id == 1 || auth()->user()->can('can_view_salaries') || auth()->user()->can('can_manage_salaries')) {
         $query->with('currentSalary');
    }

    return $query->findOrFail($id);

}


    // ==============================
    // PUT /api/employees/{id}
    // ==============================
    public function update(Request $request, $id)
    {
        // Only SuperAdmin, Admin & HR
        if (!in_array(auth()->user()->role_id, [1, 2, 3])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $employee = Employee::findOrFail($id);

        $rules = [
            'department_id'  => ['sometimes', 'nullable', 'exists:departments,id'],
            'name'           => ['sometimes', 'string', 'max:255'],
            'phone'          => ['sometimes', 'nullable', 'string', 'max:20'],
            'address'        => ['sometimes', 'nullable', 'string', 'max:255'],
            'date_of_joining'=> ['sometimes', 'nullable', 'date'],
            'dob'            => ['sometimes', 'nullable', 'date'],
            'gender'         => ['sometimes', 'nullable', 'string', 'max:20'],
            'marital_status' => ['sometimes', 'nullable', 'string', 'max:20'],
            'emergency_contact' => ['sometimes', 'nullable', 'string', 'max:20'],
            'aadhar_number'  => ['sometimes', 'nullable', 'digits:12'],
            'pan_number'     => ['sometimes', 'nullable', 'regex:/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i'],
            'designation_name' => ['sometimes', 'nullable', 'string', 'max:255'], 
            'reports_to'     => ['sometimes', 'nullable', 'exists:employees,id'],
            'gross_salary'   => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'pf_opt_out' => 'boolean',
            'esic_opt_out' => 'boolean',
            'ptax_opt_out' => 'boolean',
            'status' => ['sometimes', 'in:Active,Inactive'],
            'profile_photo'  => ['sometimes', 'nullable', 'image', 'mimes:jpg,jpeg,png', 'max:2048'],
        ];

        // Conditional Validation for Email and Employee Code
        if ($employee->user_id) {
             $rules['email'] = ['sometimes', 'email', Rule::unique('users', 'email')->ignore($employee->user_id)];
        }
        $rules['employee_code'] = ['sometimes', 'nullable', 'string', 'max:50', Rule::unique('employees', 'employee_code')->ignore($employee->id)];

        $validated = $request->validate($rules);

        // Handle File Upload
        if ($request->hasFile('profile_photo')) {
            // Delete old photo if exists
            if ($employee->profile_photo && \Illuminate\Support\Facades\Storage::disk('public')->exists($employee->profile_photo)) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($employee->profile_photo);
            }
            $validated['profile_photo'] = $request->file('profile_photo')->store('employees', 'public');
        }

        // Handle Designation (Hybrid)
        if ($request->has('designation_name')) {
            $designationName = trim($request->designation_name);
            if (!empty($designationName)) {
                $designation = \App\Models\Designation::firstOrCreate(
                    ['name' => $designationName],
                    ['is_active' => true]
                );
                $validated['designation_id'] = $designation->id;
                unset($validated['designation_name']);
            }
        }

        // HIERARCHY & CIRCULAR CHECK
        if ($request->has('reports_to')) {
            $newManagerId = $request->reports_to;
            
            // 1. Circular Check
            if ($newManagerId == $employee->id) {
                 return response()->json(['message' => 'Employee cannot report to themselves.'], 422);
            }
            if ($newManagerId) {
                // Check if new manager reports to this employee (direct or indirect)
                 $manager = Employee::find($newManagerId);
                 $subordinates = $employee->getAllSubordinateIds()->toArray();
                 if (in_array($newManagerId, $subordinates)) {
                     return response()->json(['message' => 'Circular Reporting Detected: You cannot report to your own subordinate.'], 422);
                 }

                // 2. Hierarchy Level Check - REMOVED for Flat Structure
                // if ($mgrDesignation->level >= $empDesignation->level) { ... }
            }
        }

        // Calculate Salary if updated
        if (($request->has('gross_salary') || $request->has('pf_opt_out')) && (auth()->user()->role_id == 1 || auth()->user()->can('can_manage_salaries'))) {
             $salaryData = $this->calculateSalaryComponents(
                $request->gross_salary ?? $employee->salary,
                $request->has('pf_opt_out') ? $request->boolean('pf_opt_out') : $employee->pf_opt_out,
                $request->has('esic_opt_out') ? $request->boolean('esic_opt_out') : $employee->esic_opt_out,
                $request->has('ptax_opt_out') ? $request->boolean('ptax_opt_out') : $employee->ptax_opt_out
            );
            
            $validated['salary'] = $salaryData['gross_salary'];
            
             // Update or Create Salary Record
            $salary = $employee->currentSalary;
            if ($salary) {
                $salary->update([
                    'basic' => $salaryData['basic'],
                    'hra' => $salaryData['hra'],
                    'da' => $salaryData['da'],
                    'allowances' => $salaryData['allowances'],
                    'deductions' => $salaryData['deductions'],
                    'gross_salary' => $salaryData['gross_salary'],
                ]);
            } else {
                Salary::create([
                    'employee_id' => $employee->id,
                    'basic' => $salaryData['basic'],
                    'hra' => $salaryData['hra'],
                    'da' => $salaryData['da'],
                    'allowances' => $salaryData['allowances'],
                    'deductions' => $salaryData['deductions'],
                    'gross_salary' => $salaryData['gross_salary'],
                ]);
            }
             // Create Salary History
            \App\Models\SalaryHistory::create([
                'employee_id' => $employee->id,
                'basic' => $salaryData['basic'],
                'hra' => $salaryData['hra'],
                'da' => $salaryData['da'],
                'allowances' => $salaryData['allowances'],
                'deductions' => $salaryData['deductions'],
                'gross_salary' => $salaryData['gross_salary'],
            ]);
        }
        
        // Ensure opt-out flags are updated in employee record if passed
        if ($request->has('pf_opt_out')) $validated['pf_opt_out'] = $request->boolean('pf_opt_out');
        if ($request->has('esic_opt_out')) $validated['esic_opt_out'] = $request->boolean('esic_opt_out');
        if ($request->has('ptax_opt_out')) $validated['ptax_opt_out'] = $request->boolean('ptax_opt_out');

        // Update User (Name/Email/Status)
        if ($employee->user) {
             $userUpdates = [];
             if ($request->has('name')) $userUpdates['name'] = $request->name;
             if ($request->has('email')) $userUpdates['email'] = $request->email;
             if ($request->has('status')) {
                 $userUpdates['is_active'] = ($request->status === 'Active');
             }
             if (!empty($userUpdates)) {
                 $employee->user->update($userUpdates);
             }
        }

        // Exclude User fields and non-column fields from Employee update
        $employeeData = \Illuminate\Support\Arr::except($validated, [
            'name', 'email', 'status', 'password', 'designation_name', 'gross_salary', 'profile_photo'
        ]);
        $employee->update($employeeData);

        return response()->json([
            'message'  => 'Employee updated successfully.',
            'employee' => $employee->fresh()->load(['department', 'designation', 'manager', 'user:id,name,email'])
        ]);
    }

    // ==============================
    // DELETE /api/employees/{id}
    // ==============================
    public function destroy($id)
    {
        // Allow HR (3) if they have 'can_manage_employees' validation is usually in middleware, but explicit check here is good
        // Current Middleware: role:1,2,3 for 'destroy' (if defined in api.php).
        // Let's check permissive:
        $user = auth()->user();
        if (!in_array($user->role_id, [1, 2]) && !($user->role_id === 3 && $user->can('can_manage_employees'))) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $employee = Employee::findOrFail($id);
        
        // Delete User as well? Usually yes.
        if ($employee->user) {
            $employee->user->delete();
        }
        $employee->delete();

        return response()->json(['message' => 'Employee deleted']);
    }

    // ==============================
    // MY TEAM (Manager View)
    // ==============================
    public function myTeam()
    {
        try {
            $user = auth()->user();

            if ($user->role_id != 4) {
                 return response()->json(['message' => 'Unauthorized'], 403);
            }

            $manager = $user->employee;
            if (!$manager) {
                 return response()->json(['message' => 'Employee profile not found'], 404);
            }

            $subordinateIds = $manager->getAllSubordinateIds();
            
            $team = Employee::with(['user:id,name,email', 'department', 'designation']) 
                    ->whereIn('id', $subordinateIds)
                    ->get();

            return response()->json($team);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Server Error', 
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }


    // ==============================
    // ATTENDANCE METHODS (Unified)
    // ==============================

    // GET /api/employees/{id}/attendance
    public function attendance(Request $request, $id)
    {
        $employee = Employee::findOrFail($id);
        
        // Permission Check: View Self or View Any (if allowed)
        // If user is accessing their own, allow. If accessing others, check perms.
        if (auth()->id() != $employee->user_id && !auth()->user()->can('can_view_attendance')) {
             return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $query = \App\Models\Attendance::where('employee_id', $employee->id);

        if ($request->has('month')) {
            $month = $request->month; // YYYY-MM
            $query->where('date', 'like', "$month%");
        }

        if ($request->has('year')) {
            $query->whereYear('date', $request->year);
        }

        $attendance = $query->orderByDesc('date')->paginate(15);

        return response()->json($attendance);
    }

    // GET /api/employees/{id}/attendance/summary
    public function attendanceSummary(Request $request, $id)
    {
        $employee = Employee::findOrFail($id);
        
        if (auth()->id() != $employee->user_id && !auth()->user()->can('can_view_attendance')) {
             return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = \App\Models\Attendance::where('employee_id', $employee->id);

        if ($request->has('month')) {
            $month = $request->month; // YYYY-MM
            $query->where('date', 'like', "$month%");
        }

        $stats = [
            'present' => (clone $query)->where('status', 'Present')->count(),
            'absent' => (clone $query)->where('status', 'Absent')->count(),
            'late' => (clone $query)->where('status', 'Late')->count(),
            'on_leave' => (clone $query)->where('status', 'On Leave')->count(),
        ];

        return response()->json($stats);
    }

    // GET /api/employees/{id}/attendance/export
    public function attendanceExport(Request $request, $id)
    {
        $employee = Employee::with('user')->findOrFail($id);
        
        if (auth()->id() != $employee->user_id && !auth()->user()->can('can_view_attendance') && !auth()->user()->can('can_manage_attendance')) {
             return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = \App\Models\Attendance::where('employee_id', $employee->id);

        if ($request->has('month')) {
            $month = $request->month; // YYYY-MM
            $query->where('date', 'like', "$month%");
        }

        $attendance = $query->orderBy('date', 'asc')->get();

        $csvFileName = "attendance_{$employee->employee_code}_{$request->month}.csv";
        $headers = [
            "Content-type" => "text/csv",
            "Content-Disposition" => "attachment; filename=$csvFileName",
            "Pragma" => "no-cache",
            "Cache-Control" => "must-revalidate, post-check=0, pre-check=0",
            "Expires" => "0"
        ];

        $callback = function() use ($attendance, $employee) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Employee Code', 'Name', 'Date', 'Check In', 'Check Out', 'Status']);

            foreach ($attendance as $row) {
                fputcsv($file, [
                    $employee->employee_code,
                    $employee->user->name,
                    $row->date,
                    $row->check_in,
                    $row->check_out,
                    $row->status
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}