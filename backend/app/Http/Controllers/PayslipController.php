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

        $employee = Employee::find($request->employee_id);
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

        // --- PAYROLL CALCULATION ENGINE ---

        // 1. Proration Logic (30-day fixed month)
        $totalDaysInMonth = 30;
        $payableDays = 30;

        $joinDate = \Carbon\Carbon::parse($employee->date_of_joining);
        $payslipDate = \Carbon\Carbon::createFromDate($request->year, $request->month, 1);

        if ($joinDate->gt($payslipDate->copy()->endOfMonth())) {
            return response()->json(['message' => 'Employee joined after this month'], 422);
        }

        if ($joinDate->isSameMonth($payslipDate)) {
            // e.g. Joined 15th. Pay = 30 - 15 + 1 = 16 days.
            // If Joined 31st (in a 31 day month), simpler logic: limit day to 30?
            // "Month = 30 days". We treat all months as having 30 days for calculation.
            $dayOfJoining = min($joinDate->day, 30);
            $payableDays = 30 - $dayOfJoining + 1;
        } elseif ($request->year == $joinDate->year && $request->month < $joinDate->month) {
             return response()->json(['message' => 'Employee joined after this month'], 422);
        }

        // Ensure 0 <= payableDays <= 30
        $payableDays = max(0, min(30, $payableDays));
        $prorationFactor = $payableDays / 30;

        // 2. Fetch Policies
        $policies = \App\Models\PayrollPolicy::all()->pluck('value', 'key');
        $basicPercent = floatval($policies['basic_percentage'] ?? 70);
        $pfEnabled    = filter_var($policies['pf_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $esicEnabled  = filter_var($policies['esic_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $ptaxEnabled  = filter_var($policies['ptax_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $ptaxSlabs    = json_decode($policies['ptax_slabs'] ?? '[]', true);

        // 3. Calculate Earnings
        // Use 'gross_salary' from Salary table as the monthly rate
        $monthlyGross = $salary->gross_salary;
        $earnedGross  = $monthlyGross * $prorationFactor;

        $basic = $earnedGross * ($basicPercent / 100);
        $hra   = $earnedGross - $basic;

        // 4. Calculate Deductions
        $pf = 0;
        $esic = 0;
        $ptax = 0;

        // PF (12% of Basic)
        if ($pfEnabled && !$employee->pf_opt_out) {
            $pf = $basic * 0.12;
        }

        // ESIC (0.75% of Gross)
        if ($esicEnabled && !$employee->esic_opt_out) {
            $esic = $earnedGross * 0.0075;
        }

        // PTAX (Slab based on Gross)
        if ($ptaxEnabled && !$employee->ptax_opt_out) {
            foreach ($ptaxSlabs as $slab) {
                // Ensure we cast slab values to float/int
                $min = floatval($slab['min']);
                $max = floatval($slab['max']);
                if ($earnedGross >= $min && $earnedGross <= $max) {
                    $ptax = floatval($slab['amount']);
                    break;
                }
            }
        }

        // Rounding
        $basic = round($basic, 2);
        $hra = round($hra, 2);
        $pf = round($pf, 2);
        $esic = round($esic, 2);
        $ptax = round($ptax, 2);
        $earnedGross = round($earnedGross, 2);

        $totalDeductions = $pf + $esic + $ptax;
        $netPay = $earnedGross - $totalDeductions;

        $payslip = Payslip::create([
            'employee_id'      => $request->employee_id,
            'month'            => $request->month,
            'year'             => $request->year,
            'days_worked'      => $payableDays,
            'gross_salary'     => $earnedGross,
            'basic'            => $basic,
            'hra'              => $hra,
            'pf'               => $pf,
            'esic'             => $esic,
            'ptax'             => $ptax,
            'total_earnings'   => $earnedGross,
            'total_deductions' => $totalDeductions,
            'net_pay'          => $netPay,
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
    // UPDATE PAYSLIP (Admin + SuperAdmin)
    // ======================================
    public function update(Request $request, $id)
    {
        if (!in_array(auth()->user()->role_id, [1, 2])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $payslip = Payslip::find($id);

        if (!$payslip) {
            return response()->json(['message' => 'Payslip not found'], 404);
        }

        $request->validate([
            'basic_salary' => 'required|numeric|min:0',
            'hra'          => 'required|numeric|min:0',
            'allowances'   => 'required|numeric|min:0',
            'deductions'   => 'required|numeric|min:0',
        ]);

        // Note: The database schema might not store basic/hra/allowances separately if they are not columns.
        // The migration showed: total_earnings, total_deductions, net_pay.
        // So we must calculate total_earnings from the input if we want to update it.
        // But wait, the EditPayslipModal sends basic_salary, hra, allowances.
        // If the DB only has total_earnings, we can only update total_earnings.
        // However, for better data integrity, we should sum them up.
        
        $total_earnings = $request->basic_salary + $request->hra + $request->allowances;
        $total_deductions = $request->deductions;
        $net_pay = $total_earnings - $total_deductions;

        $payslip->update([
            'total_earnings'   => $total_earnings,
            'total_deductions' => $total_deductions,
            'net_pay'          => $net_pay,
        ]);

        return response()->json([
            'message' => 'Payslip updated successfully',
            'payslip' => $payslip->load('employee.user:id,name,email')
        ]);
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

    // ======================================
    // EMPLOYEE VIEW OWN PAYSLIPS
    // ======================================
    public function myPayslips()
    {
        $user = auth()->user();

        if ($user->role_id != 4) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $employee = $user->employee;

        if (!$employee) {
            return response()->json(['message' => 'Employee profile not found'], 404);
        }

        $payslips = Payslip::where('employee_id', $employee->id)
            ->orderByDesc('year')
            ->orderByDesc('month')
            ->get();

        return response()->json($payslips);
    }
}