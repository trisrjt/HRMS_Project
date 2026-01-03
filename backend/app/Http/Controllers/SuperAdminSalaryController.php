<?php

namespace App\Http\Controllers;

use App\Models\Salary;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SuperAdminSalaryController extends Controller
{
    // GET /api/superadmin/salaries
    public function index(Request $request)
    {
        $query = Employee::with(['user', 'department', 'currentSalary']);

        // Filter by Department
        if ($request->has('department_id') && $request->department_id) {
            $query->where('department_id', $request->department_id);
        }

        // Search by Employee Name/Code/Email
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

        // Transform data to flatten salary structure
        $employees->getCollection()->transform(function ($employee) {
            $salary = $employee->currentSalary;
            return [
                'id' => $salary ? $salary->id : null, // Salary ID if exists
                'employee_id' => $employee->id,
                'employee' => $employee, // Full employee object for frontend
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

    // GET /api/superadmin/salaries/history/{employeeId}
    public function history($employeeId)
    {
        $history = \App\Models\SalaryHistory::where('employee_id', $employeeId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($item) {
                return [
                    "month" => $item->created_at->format('Y-m-d H:i:s'), // Using timestamp as "month" for now to show exact edit time
                    "basic" => $item->basic,
                    "hra" => $item->hra,
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

    // POST /api/superadmin/salaries/create
    public function create(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,id|unique:salaries,employee_id',
            'gross_salary' => 'required|numeric|min:0',
        ]);

        $employee = Employee::findOrFail($request->employee_id);

        // Auto-calculate components based on Payroll Policy & Employee Opt-out settings
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
        \App\Models\SalaryHistory::create([
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

        return response()->json(['message' => 'Salary created successfully', 'salary' => $salary]);
    }

    // POST /api/superadmin/salaries/update
    public function update(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'gross_salary' => 'required|numeric|min:0',
        ]);

        $salary = Salary::where('employee_id', $request->employee_id)->first();

        if (!$salary) {
            return $this->create($request); // Create if not exists
        }

        $employee = Employee::findOrFail($request->employee_id);

        // Auto-calculate components based on Payroll Policy & Employee Opt-out settings
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
        \App\Models\SalaryHistory::create([
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

        return response()->json(['message' => 'Salary updated successfully', 'salary' => $salary]);
    }

    // GET /api/superadmin/salaries/export
    public function export(Request $request)
    {
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
            'pf' => $pf,
            'esic' => $esic,
            'ptax' => $ptax,
            'deductions' => $totalDeductions,
            'gross_salary' => $gross_salary
        ];
    }
}
