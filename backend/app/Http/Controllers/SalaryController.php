<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Salary;
use App\Models\Employee;
use Illuminate\Support\Facades\DB;

class SalaryController extends Controller
{
    // ======================================
    // GET ALL SALARIES (Unifies Listing Logic)
    // Only SuperAdmin (1), Admin (2), HR (3)
    // ======================================
    public function index(Request $request)
    {
        // Permission Check: View Salaries
        if (!auth()->user()->can('can_view_salaries') && !in_array(auth()->user()->role_id, [1, 2, 3])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = Employee::with(['user:id,name,email', 'department:id,name', 'currentSalary', 'currentSalary.employee.user:id,name,email']);

        // Filter by Department
        if ($request->has('department_id') && $request->department_id) {
            $query->where('department_id', $request->department_id);
        }

        // Search by Employee Name/Code
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('employee_code', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($u) use ($search) {
                      $u->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        // Sort by Employee Name
        $query->whereHas('user', function($q) {
            $q->orderBy('name', 'asc');
        });

        $employees = $query->paginate(15);

        // Transform data to flatten salary structure (Frontend Expectation)
        $employees->getCollection()->transform(function ($employee) {
            $salary = $employee->currentSalary;
            return [
                'id' => $salary ? $salary->id : null, 
                'employee_id' => $employee->id,
                'employee' => $employee, // Full employee object
                'basic' => $salary ? $salary->basic : 0,
                'hra' => $salary ? $salary->hra : 0,
                'pf' => $salary ? $salary->pf : 0,
                'esic' => $salary ? $salary->esic : 0,
                'ptax' => $salary ? $salary->ptax : 0,
                'deductions' => $salary ? $salary->deductions : 0,
                'gross_salary' => $salary ? $salary->gross_salary : 0,
                'updated_at' => $salary ? $salary->updated_at : null,
            ];
        });

        return response()->json($employees);
    }

    // ======================================
    // CREATE / STORE SALARY
    // Permission: can_manage_salaries
    // ======================================
    public function store(Request $request)
    {
        if (!auth()->user()->can('can_manage_salaries') && !in_array(auth()->user()->role_id, [1, 2])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'employee_id'  => 'required|exists:employees,id|unique:salaries,employee_id',
            'gross_salary' => 'required|numeric|min:0',
        ]);

        $employee = Employee::findOrFail($request->employee_id);

        $salaryData = $this->calculateSalaryComponents(
            $request->gross_salary,
            $employee->pf_opt_out,
            $employee->esic_opt_out,
            $employee->ptax_opt_out
        );

        $salary = Salary::create([
            'employee_id' => $request->employee_id,
            'basic' => $salaryData['basic'],
            'hra' => $salaryData['hra'],
            'pf' => $salaryData['pf'],
            'esic' => $salaryData['esic'],
            'ptax' => $salaryData['ptax'],
            'da' => 0,
            'allowances' => 0,
            'deductions' => $salaryData['deductions'],
            'gross_salary' => $salaryData['gross_salary'],
        ]);

        // Create History Record
        \App\Models\SalaryHistory::create(array_merge($salary->toArray(), ['salary_id' => $salary->id]));

        return response()->json([
            'message' => 'Salary record created successfully',
            'salary'  => $salary->load('employee.user:id,name,email')
        ], 201);
    }

    // ======================================
    // UPDATE SALARY
    // Permission: can_manage_salaries
    // ======================================
    public function update(Request $request, $id = null)
    {
        // Support both old route with ID and new route without ID (generic update)
        // If ID is not passed, use employee_id from request to find record
        
        if (!auth()->user()->can('can_manage_salaries') && !in_array(auth()->user()->role_id, [1, 2])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'gross_salary' => 'required|numeric|min:0',
        ]);

        $salary = Salary::where('employee_id', $request->employee_id)->first();

        // If not found, create it (Upsert logic)
        if (!$salary) {
            return $this->store($request);
        }

        $employee = Employee::findOrFail($request->employee_id);

        $salaryData = $this->calculateSalaryComponents(
            $request->gross_salary,
            $employee->pf_opt_out,
            $employee->esic_opt_out,
            $employee->ptax_opt_out
        );

        $salary->update([
            'basic' => $salaryData['basic'],
            'hra' => $salaryData['hra'],
            'pf' => $salaryData['pf'],
            'esic' => $salaryData['esic'],
            'ptax' => $salaryData['ptax'],
            'da' => 0,
            'allowances' => 0,
            'deductions' => $salaryData['deductions'],
            'gross_salary' => $salaryData['gross_salary'],
        ]);

        // Create History Record
        \App\Models\SalaryHistory::create(array_merge($salary->toArray(), ['salary_id' => $salary->id]));

        return response()->json([
            'message' => 'Salary updated successfully',
            'salary'  => $salary->load('employee.user:id,name,email')
        ]);
    }

    // ======================================
    // SHOW SINGLE (Mixed usage)
    // ======================================
    public function show($id)
    {
        $salary = Salary::with('employee.user:id,name,email')->find($id);

        if (!$salary) {
            return response()->json(['message' => 'Salary record not found'], 404);
        }

        $user = auth()->user();

        // Employee Check
        if ($user->role_id == 4) {
            if ($salary->employee->user_id != $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
            return response()->json($salary);
        }

        // Admin/HR Check
        if (!auth()->user()->can('can_view_salaries') && !in_array($user->role_id, [1, 2, 3])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($salary);
    }

    // ======================================
    // HISTORY
    // ======================================
    public function history($employeeId)
    {
        if (!auth()->user()->can('can_view_salaries') && !in_array(auth()->user()->role_id, [1, 2, 3])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $history = \App\Models\SalaryHistory::where('employee_id', $employeeId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($item) {
                return [
                    "month" => $item->created_at->format('Y-m-d H:i:s'), 
                    "basic" => $item->basic,
                    "hra" => $item->hra,
                    "pf" => $item->pf,
                    "esic" => $item->esic,
                    "ptax" => $item->ptax,
                    "deductions" => $item->deductions,
                    "gross_salary" => $item->gross_salary,
                    "updated_at" => $item->created_at
                ];
            });

        return response()->json($history);
    }

     // ======================================
    // EXPORT
    // ======================================
    public function export(Request $request)
    {
        if (!auth()->user()->can('can_view_salaries') && !in_array(auth()->user()->role_id, [1, 2, 3])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = Salary::with(['employee.user', 'employee.department']);

        if ($request->has('department_id') && $request->department_id) {
            $query->whereHas('employee', function ($q) use ($request) {
                $q->where('department_id', $request->department_id);
            });
        }
        
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->whereHas('employee', function ($q) use ($search) {
                $q->where('employee_code', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($u) use ($search) {
                      $u->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        $salaries = $query->get();

        $csvFileName = "salaries_export_" . date('Y-m-d') . ".csv";
        $headers = [
            "Content-type" => "text/csv",
            "Content-Disposition" => "attachment; filename=$csvFileName",
            "Pragma" => "no-cache",
            "Cache-Control" => "must-revalidate, post-check=0, pre-check=0",
            "Expires" => "0"
        ];

        $callback = function() use ($salaries) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Employee Name', 'Code', 'Department', 'Basic', 'HRA', 'DA', 'Allowances', 'Deductions', 'Gross Salary', 'Last Updated']);

            foreach ($salaries as $salary) {
                fputcsv($file, [
                    $salary->employee->user->name,
                    $salary->employee->employee_code,
                    $salary->employee->department->name,
                    $salary->basic,
                    $salary->hra,
                    $salary->da,
                    $salary->allowances,
                    $salary->deductions,
                    $salary->gross_salary,
                    $salary->updated_at
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }


    /**
     * Get the global payroll policy configuration.
     */
    public function getPayrollPolicy()
    {
        $policy = \App\Models\PayrollPolicy::first();

        if (!$policy) {
            return response()->json([
                'basic_percentage' => 40,
                'hra_percentage' => 20,
                'da_percentage' => 10,
                'pf_enabled' => false,
                'pf_employee_share' => 12,
                'pf_employer_share' => 12,
                'esic_enabled' => false,
                'esic_employee_share' => 0.75,
                'esic_employer_share' => 3.25,
                'ptax_enabled' => false,
                'ptax_slabs' => json_encode([])
            ]);
        }

        return response()->json($policy);
    }

    public function mySalary()
    {
        $user = auth()->user();
        if ($user->role_id != 4) return response()->json(['message' => 'Unauthorized'], 403);
        
        $employee = $user->employee;
        if (!$employee) return response()->json(['message' => 'Employee profile not found'], 404);

        $salary = Salary::where('employee_id', $employee->id)->latest()->first();
        if (!$salary) return response()->json(['salary' => null], 200);

        return response()->json($salary);
    }
    
    // Helper: Calculation Logic
    private function calculateSalaryComponents($gross_salary, $pf_opt_out, $esic_opt_out, $ptax_opt_out)
    {
        $policies = \App\Models\PayrollPolicy::all()->pluck('value', 'key');
        
        $basicPercent = $policies['basic_percentage'] ?? 70;
        $pfEnabled = filter_var($policies['pf_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $esicEnabled = filter_var($policies['esic_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $ptaxEnabled = filter_var($policies['ptax_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN);
        
        $ptaxSlabsVal = $policies['ptax_slabs'] ?? '[]';
        $ptaxSlabs = is_string($ptaxSlabsVal) ? json_decode($ptaxSlabsVal, true) : $ptaxSlabsVal;

        $basic = round(floatval($gross_salary) * ($basicPercent / 100));
        $hra = floatval($gross_salary) - $basic;
        
        $pf = 0;
        if ($pfEnabled && !$pf_opt_out) {
            $pf = round($basic * 0.12);
        }
        
        $esic = 0;
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
            'pf' => $pf,
            'esic' => $esic,
            'ptax' => $ptax,
            'deductions' => $totalDeductions,
            'gross_salary' => $gross_salary
        ];
    }
}