<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Salary;
use App\Models\Employee;

class SalaryController extends Controller
{
    /**
     * 🔹 Get all salary records
     */
    public function index()
    {
        return response()->json(Salary::with('employee')->get());
    }

    /**
     * 🔹 Create salary record (assign to employee)
     */
    public function store(Request $request)
    {
        $request->validate([
            'employee_id'  => 'required|exists:employees,id',
            'basic'        => 'required|numeric|min:0',
            'hra'          => 'required|numeric|min:0',
            'da'           => 'required|numeric|min:0',
            'deductions'   => 'nullable|numeric|min:0',
        ]);

        $gross = $request->basic + $request->hra + $request->da - ($request->deductions ?? 0);

        $salary = Salary::create([
            'employee_id'  => $request->employee_id,
            'basic'        => $request->basic,
            'hra'          => $request->hra,
            'da'           => $request->da,
            'deductions'   => $request->deductions ?? 0,
            'gross_salary' => $gross,
        ]);

        return response()->json([
            'message' => 'Salary record created successfully',
            'salary'  => $salary
        ], 201);
    }

    /**
     * 🔹 Show single salary record
     */
    public function show($id)
    {
        $salary = Salary::with('employee')->find($id);

        if (!$salary) {
            return response()->json(['message' => 'Salary record not found'], 404);
        }

        return response()->json($salary);
    }

    /**
     * 🔹 Update salary
     */
    public function update(Request $request, $id)
    {
        $salary = Salary::findOrFail($id);

        $request->validate([
            'basic'      => 'required|numeric|min:0',
            'hra'        => 'required|numeric|min:0',
            'da'         => 'required|numeric|min:0',
            'deductions' => 'nullable|numeric|min:0',
        ]);

        $gross = $request->basic + $request->hra + $request->da - ($request->deductions ?? 0);

        $salary->update([
            'basic'        => $request->basic,
            'hra'          => $request->hra,
            'da'           => $request->da,
            'deductions'   => $request->deductions ?? 0,
            'gross_salary' => $gross,
        ]);

        return response()->json([
            'message' => 'Salary updated successfully',
            'salary'  => $salary
        ]);
    }

    /**
     * 🔹 Delete salary record
     */
    public function destroy($id)
    {
        $salary = Salary::find($id);

        if (!$salary) {
            return response()->json(['message' => 'Salary not found'], 404);
        }

        $salary->delete();

        return response()->json(['message' => 'Salary deleted successfully']);
    }
}