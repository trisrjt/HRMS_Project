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
                'da' => $salary ? $salary->da : 0,
                'deductions' => $salary ? $salary->deductions : 0,
                'gross_salary' => $salary ? $salary->gross_salary : 0,
                'updated_at' => $salary ? $salary->updated_at : null,
            ];
        });

        return response()->json($employees);
    }

    // GET /api/superadmin/salaries/history/{employee_id}
    public function history($employeeId)
    {
        // Since we likely don't have a separate "SalaryHistory" table and `Salary` is 1-to-1 (current),
        // We will try to fetch generated Payslips as "History" if available, 
        // OR just return the current salary as the only history record for now if Payslips aren't linked.
        // Let's check if we have Payslip model.
        // If not, I will just return the current salary as a single history item to satisfy the frontend.
        
        $salary = Salary::where('employee_id', $employeeId)->first();
        
        if (!$salary) {
            return response()->json([]);
        }

        // Mocking history from current salary for now, as we might not have historical structure changes stored.
        // In a real app, we'd query a SalaryHistory table or AuditLog.
        // Or we could return Payslips.
        // Let's return a list containing the current salary labeled with current month.
        
        $history = [
            [
                "month" => date('Y-m'),
                "basic" => $salary->basic,
                "hra" => $salary->hra,
                "da" => $salary->da,
                "deductions" => $salary->deductions,
                "gross_salary" => $salary->gross_salary,
                "updated_at" => $salary->updated_at
            ]
        ];

        return response()->json($history);
    }

    // POST /api/superadmin/salaries/create
    public function create(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,id|unique:salaries,employee_id',
            'basic' => 'required|numeric|min:0',
            'hra' => 'required|numeric|min:0',
            'da' => 'required|numeric|min:0',
            'deductions' => 'nullable|numeric|min:0',
        ]);

        $gross = $request->basic + $request->hra + $request->da - ($request->deductions ?? 0);

        $salary = Salary::create([
            'employee_id' => $request->employee_id,
            'basic' => $request->basic,
            'hra' => $request->hra,
            'da' => $request->da,
            'deductions' => $request->deductions ?? 0,
            'gross_salary' => $gross,
        ]);

        return response()->json(['message' => 'Salary created successfully', 'salary' => $salary]);
    }

    // POST /api/superadmin/salaries/update
    public function update(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'basic' => 'required|numeric|min:0',
            'hra' => 'required|numeric|min:0',
            'da' => 'required|numeric|min:0',
            'deductions' => 'nullable|numeric|min:0',
        ]);

        $salary = Salary::where('employee_id', $request->employee_id)->first();

        if (!$salary) {
            return $this->create($request); // Create if not exists
        }

        $gross = $request->basic + $request->hra + $request->da - ($request->deductions ?? 0);

        $salary->update([
            'basic' => $request->basic,
            'hra' => $request->hra,
            'da' => $request->da,
            'deductions' => $request->deductions ?? 0,
            'gross_salary' => $gross,
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
            fputcsv($file, ['Employee Name', 'Code', 'Department', 'Basic', 'HRA', 'DA', 'Deductions', 'Gross Salary', 'Last Updated']);

            foreach ($salaries as $salary) {
                fputcsv($file, [
                    $salary->employee->user->name,
                    $salary->employee->employee_code,
                    $salary->employee->department->name,
                    $salary->basic,
                    $salary->hra,
                    $salary->da,
                    $salary->deductions,
                    $salary->gross_salary,
                    $salary->updated_at
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
