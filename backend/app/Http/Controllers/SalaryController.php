<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Salary;
use App\Models\Employee;

class SalaryController extends Controller
{
    // ======================================
    // GET ALL SALARIES
    // Only SuperAdmin + Admin
    // ======================================
    public function index()
    {
        if (!in_array(auth()->user()->role_id, [1, 2])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json(
            Salary::with('employee.user:id,name,email')->get()
        );
    }

    // ======================================
    // CREATE SALARY (SuperAdmin + Admin)
    // ======================================
    public function store(Request $request)
    {
        if (!in_array(auth()->user()->role_id, [1, 2])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

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
            'salary'  => $salary->load('employee.user:id,name,email')
        ], 201);
    }

    // ======================================
    // GET SINGLE SALARY
    // Admin+SuperAdmin → any salary
    // Employee → only own salary
    // ======================================
    public function show($id)
    {
        $salary = Salary::with('employee.user:id,name,email')->find($id);

        if (!$salary) {
            return response()->json(['message' => 'Salary record not found'], 404);
        }

        $user = auth()->user();

        // Employee can ONLY view their own salary
        if ($user->role_id == 4) {
            if ($salary->employee->user_id != $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        // HR cannot see salary at all
        if ($user->role_id == 3) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($salary);
    }

    // ======================================
    // UPDATE SALARY (SuperAdmin + Admin)
    // ======================================
    public function update(Request $request, $id)
    {
        if (!in_array(auth()->user()->role_id, [1, 2])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

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
            'salary'  => $salary->load('employee.user:id,name,email')
        ]);
    }

    // ======================================
    // DELETE SALARY — Disabled (Safe system)
    // ======================================
    public function destroy($id)
    {
        return response()->json([
            'message' => 'Deleting salary records is not allowed'
        ], 403);
    }

    // ======================================
    // EMPLOYEE VIEW OWN SALARY
    // ======================================
    public function mySalary()
    {
        $user = auth()->user();

        if ($user->role_id != 4) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $employee = $user->employee;

        if (!$employee) {
            return response()->json(['message' => 'Employee profile not found'], 404);
        }

        $salary = Salary::where('employee_id', $employee->id)->first();

        if (!$salary) {
            return response()->json(['message' => 'Salary record not found'], 404);
        }

        return response()->json($salary);
    }
}