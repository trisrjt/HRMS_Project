<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\User;
use App\Models\Salary;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class SuperAdminEmployeeController extends Controller
{
    // GET /api/superadmin/employees
    public function index(Request $request)
    {
        $query = Employee::with(['user', 'department', 'designation', 'currentSalary']);

        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            })->orWhere('employee_code', 'like', "%{$search}%");
        }

        if ($request->has('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        $employees = $query->get();
        return response()->json($employees);
    }

    // POST /api/superadmin/employees
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'department_id' => 'required|exists:departments,id',
            'designation_name' => 'required|string|max:255',
            'date_of_joining' => 'required|date',
            'dob' => 'required|date|before:today',
            'aadhar_number' => 'nullable|digits:12',
            'pan_number' => 'nullable|regex:/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i',
            'phone' => 'required|digits:10',
            'emergency_contact' => 'nullable|digits:10',
            'gender' => 'nullable|string|in:Male,Female,Other',
            'marital_status' => 'nullable|string|in:Single,Married,Other',
            'address' => 'nullable|string|max:1000',
            'profile_photo' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
            'gross_salary' => 'nullable|numeric',
            'reports_to' => 'nullable|exists:employees,id',
            'pf_opt_out' => 'boolean',
            'esic_opt_out' => 'boolean',
            'ptax_opt_out' => 'boolean',
        ]);

        DB::beginTransaction();
        try {
            // Handle File Upload
            $profilePhotoPath = null;
            if ($request->hasFile('profile_photo')) {
                $profilePhotoPath = $request->file('profile_photo')->store('employees', 'public');
            }

            // Generate password based on name (FirstName@123)
            $firstName = explode(' ', trim($validated['name']))[0];
            $plainPassword = ucfirst($firstName) . '@123';

            // Create User
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($plainPassword),
                'temp_password' => $plainPassword,
                'role_id' => 4, // Employee role
                'is_active' => true,
            ]);

            // Handle Designation (Hybrid)
            $designationName = trim($request->designation_name);
            $designation = \App\Models\Designation::firstOrCreate(
                ['name' => $designationName],
                ['is_active' => true]
            );

            // Calculate Salary Components
            $salaryData = [
                'basic' => 0, 'hra' => 0, 'da' => 0, 'allowances' => 0, 
                'deductions' => 0, 'gross_salary' => 0
            ];

            if ($request->gross_salary > 0) {
                $salaryData = $this->calculateSalaryComponents(
                    $request->gross_salary,
                    $request->boolean('pf_opt_out'),
                    $request->boolean('esic_opt_out'),
                    $request->boolean('ptax_opt_out')
                );
            }

            // Create Employee Profile
            $employee = Employee::create([
                'user_id' => $user->id,
                'employee_code' => 'EMP' . str_pad($user->id, 3, '0', STR_PAD_LEFT),
                'department_id' => $validated['department_id'],
                'designation_id' => $designation->id,
                'date_of_joining' => $validated['date_of_joining'],
                'dob' => $validated['dob'],
                'aadhar_number' => $validated['aadhar_number'] ?? null,
                'pan_number' => $validated['pan_number'] ?? null,
                'phone' => $validated['phone'],
                'emergency_contact' => $validated['emergency_contact'] ?? null,
                'gender' => $validated['gender'] ?? null,
                'marital_status' => $validated['marital_status'] ?? null,
                'address' => $validated['address'] ?? null,
                'profile_photo' => $profilePhotoPath,
                'salary' => $salaryData['gross_salary'],
                'reports_to' => $validated['reports_to'] ?? null,
                'pf_opt_out' => $request->boolean('pf_opt_out'),
                'esic_opt_out' => $request->boolean('esic_opt_out'),
                'ptax_opt_out' => $request->boolean('ptax_opt_out'),
            ]);

            // Create Salary Record
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

            DB::commit();
            
            // Return employee data with plain password for admin to see
            $response = $employee->load('user', 'department', 'designation')->toArray();
            $response['plain_password'] = $plainPassword;
            
            return response()->json($response, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to create employee', 'error' => $e->getMessage()], 500);
        }
    }

    // PUT /api/superadmin/employees/{id}
    public function update(Request $request, $id)
    {
        $employee = Employee::findOrFail($id);
        $user = $employee->user;

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'department_id' => 'required|exists:departments,id',
            'designation_name' => 'required|string|max:255',
            'date_of_joining' => 'required|date',
            'dob' => 'required|date|before:today',
            'aadhar_number' => 'nullable|digits:12',
            'pan_number' => 'nullable|regex:/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i',
            'phone' => 'required|digits:10',
            'emergency_contact' => 'nullable|digits:10',
            'gender' => 'nullable|string|in:Male,Female,Other',
            'marital_status' => 'nullable|string|in:Single,Married,Other',
            'address' => 'nullable|string|max:1000',
            'profile_photo' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
            'status' => 'required|in:Active,Inactive',
            'reports_to' => ['nullable', 'exists:employees,id', function($attribute, $value, $fail) use ($id) {
                if ($value == $id) {
                    $fail('An employee cannot report to themselves.');
                }
            }],
            'pf_opt_out' => 'boolean',
            'esic_opt_out' => 'boolean',
            'ptax_opt_out' => 'boolean',
            'gross_salary' => 'nullable|numeric',
        ]);

        DB::beginTransaction();
        try {
            // Handle File Upload
            if ($request->hasFile('profile_photo')) {
                // Delete old photo if exists
                if ($employee->profile_photo && \Illuminate\Support\Facades\Storage::disk('public')->exists($employee->profile_photo)) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($employee->profile_photo);
                }
                $employee->profile_photo = $request->file('profile_photo')->store('employees', 'public');
            }

            // Update User
            $user->update([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'is_active' => $validated['status'] === 'Active',
            ]);

            // Handle Designation (Hybrid)
            $designationName = trim($request->designation_name);
            $designation = \App\Models\Designation::firstOrCreate(
                ['name' => $designationName],
                ['is_active' => true]
            );

            // Calculate Salary Components
            $salaryData = [
                'basic' => 0, 'hra' => 0, 'da' => 0, 'allowances' => 0, 
                'deductions' => 0, 'gross_salary' => 0
            ];

            if ($request->gross_salary > 0) {
                 $salaryData = $this->calculateSalaryComponents(
                    $request->gross_salary,
                    $request->boolean('pf_opt_out'),
                    $request->boolean('esic_opt_out'),
                    $request->boolean('ptax_opt_out')
                );
            }

            // Update Employee Profile
            $employee->update([
                'department_id' => $validated['department_id'],
                'designation_id' => $designation->id,
                'date_of_joining' => $validated['date_of_joining'],
                'dob' => $validated['dob'],
                'aadhar_number' => $validated['aadhar_number'] ?? null,
                'pan_number' => $validated['pan_number'] ?? null,
                'phone' => $validated['phone'],
                'emergency_contact' => $validated['emergency_contact'] ?? null,
                'gender' => $validated['gender'] ?? null,
                'marital_status' => $validated['marital_status'] ?? null,
                'address' => $validated['address'] ?? null,
                'salary' => $salaryData['gross_salary'],
                'reports_to' => $validated['reports_to'] ?? null,
                'pf_opt_out' => $request->boolean('pf_opt_out'),
                'esic_opt_out' => $request->boolean('esic_opt_out'),
                'ptax_opt_out' => $request->boolean('ptax_opt_out'),
            ]);

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

            DB::commit();
            return response()->json($employee->load('user', 'department', 'designation'));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to update employee', 'error' => $e->getMessage()], 500);
        }
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

    // DELETE /api/superadmin/employees/{id}
    public function destroy($id)
    {
        $employee = Employee::findOrFail($id);
        $user = $employee->user;

        DB::beginTransaction();
        try {
            // Delete profile photo if exists
            if ($employee->profile_photo && \Illuminate\Support\Facades\Storage::disk('public')->exists($employee->profile_photo)) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($employee->profile_photo);
            }
            $employee->delete();
            $user->delete();
            DB::commit();
            return response()->json(['message' => 'Employee deleted successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to delete employee', 'error' => $e->getMessage()], 500);
        }
    }

    // GET /api/superadmin/employees/{id}
    public function show($id)
    {
        $employee = Employee::with(['user', 'department', 'designation', 'currentSalary'])->findOrFail($id);
        return response()->json($employee);
    }

    // GET /api/superadmin/employees/{id}/attendance
    public function attendance(Request $request, $id)
    {
        $employee = Employee::findOrFail($id);
        
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

    // GET /api/superadmin/employees/{id}/attendance/summary
    public function attendanceSummary(Request $request, $id)
    {
        $employee = Employee::findOrFail($id);
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

    // GET /api/superadmin/employees/{id}/attendance/export
    public function attendanceExport(Request $request, $id)
    {
        $employee = Employee::with('user')->findOrFail($id);
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
