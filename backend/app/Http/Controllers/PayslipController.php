<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Payslip;
use App\Models\Salary;
use App\Models\Employee;

class PayslipController extends Controller
{
    // ======================================
    // GET ALL PAYSLIPS
    // Only SuperAdmin + Admin
    // ======================================
    public function index()
    {
        if (!in_array(auth()->user()->role_id, [1, 2])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json(
            Payslip::with('employee.user:id,name,email')->orderByDesc('id')->get()
        );
    }

    // ======================================
    // GENERATE PAYSLIP (Admin + SuperAdmin)
    // ======================================
    public function store(Request $request)
    {
        if (!in_array(auth()->user()->role_id, [1, 2])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'month'       => 'required|integer|min:1|max:12',
            'year'        => 'required|integer|min:2000|max:2100',
        ]);

        // Get salary structure
        $salary = Salary::where('employee_id', $request->employee_id)->first();

        if (!$salary) {
            return response()->json(['message' => 'Salary structure not found for this employee'], 404);
        }

        // Prevent duplicate payslips for same month/year
        if (Payslip::where('employee_id', $request->employee_id)
            ->where('month', $request->month)
            ->where('year', $request->year)
            ->exists()) {
            return response()->json(['message' => 'Payslip already generated for this month'], 409);
        }

        $total_earnings = $salary->basic + $salary->hra + $salary->da;
        $total_deductions = $salary->deductions ?? 0;
        $net_pay = $total_earnings - $total_deductions;

        $payslip = Payslip::create([
            'employee_id'      => $request->employee_id,
            'month'            => $request->month,
            'year'             => $request->year,
            'total_earnings'   => $total_earnings,
            'total_deductions' => $total_deductions,
            'net_pay'          => $net_pay,
            'generated_on'     => now(),
        ]);

        return response()->json([
            'message' => 'Payslip generated successfully',
            'payslip' => $payslip->load('employee.user:id,name,email')
        ], 201);
    }

    // ======================================
    // VIEW SINGLE PAYSLIP
    // Admin/SuperAdmin → any payslip
    // Employee → only own payslip
    // ======================================
    public function show($id)
    {
        $payslip = Payslip::with('employee.user:id,name,email')->find($id);

        if (!$payslip) {
            return response()->json(['message' => 'Payslip not found'], 404);
        }

        $user = auth()->user();

        // Employees can only view their own payslip
        if ($user->role_id == 4) {
            if ($payslip->employee->user_id != $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        // HR cannot view payslips
        if ($user->role_id == 3) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($payslip);
    }

    // ======================================
    // DELETE PAYSLIP
    // Only Admin + SuperAdmin
    // ======================================
    public function destroy($id)
    {
        if (!in_array(auth()->user()->role_id, [1, 2])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $payslip = Payslip::find($id);

        if (!$payslip) {
            return response()->json(['message' => 'Payslip not found'], 404);
        }

        $payslip->delete();

        return response()->json(['message' => 'Payslip deleted successfully']);
    }
}