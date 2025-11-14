<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Payslip;
use App\Models\Salary;
use App\Models\Employee;

class PayslipController extends Controller
{
    /**
     * 🔹 View all payslips
     */
    public function index()
    {
        return response()->json(Payslip::with('employee')->get());
    }

    /**
     * 🔹 Generate payslip for an employee
     */
    public function store(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'month'       => 'required|integer|min:1|max:12',
            'year'        => 'required|integer|min:2000|max:2100',
        ]);

        $salary = Salary::where('employee_id', $request->employee_id)->first();

        if (!$salary) {
            return response()->json(['message' => 'Salary structure not found for this employee'], 404);
        }

        $total_earnings  = $salary->basic + $salary->hra + $salary->da;
        $total_deductions = $salary->deductions ?? 0;
        $net_pay = $total_earnings - $total_deductions;

        $payslip = Payslip::create([
            'employee_id'       => $request->employee_id,
            'month'             => $request->month,
            'year'              => $request->year,
            'total_earnings'    => $total_earnings,
            'total_deductions'  => $total_deductions,
            'net_pay'           => $net_pay,
            'generated_on'      => now(),
        ]);

        return response()->json([
            'message' => 'Payslip generated successfully',
            'payslip' => $payslip
        ], 201);
    }

    /**
     * 🔹 View single payslip
     */
    public function show($id)
    {
        $payslip = Payslip::with('employee')->find($id);

        if (!$payslip) {
            return response()->json(['message' => 'Payslip not found'], 404);
        }

        return response()->json($payslip);
    }

    /**
     * 🔹 Delete payslip
     */
    public function destroy($id)
    {
        $payslip = Payslip::find($id);

        if (!$payslip) {
            return response()->json(['message' => 'Payslip not found'], 404);
        }

        $payslip->delete();

        return response()->json(['message' => 'Payslip deleted successfully']);
    }
}