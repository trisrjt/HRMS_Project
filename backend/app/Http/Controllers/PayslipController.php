<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Payslip;
use App\Models\Salary;
use App\Models\Employee;
use Barryvdh\DomPDF\Facade\Pdf;

class PayslipController extends Controller
{
    // ======================================
    // GET ALL PAYSLIPS
    // Only SuperAdmin + Admin + HR (if permission)
    // ======================================
    public function index()
    {
        if (!in_array(auth()->user()->role_id, [1, 2, 3])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json(
            Payslip::with('employee.user:id,name,email')->orderByDesc('id')->get()
        );
    }

    // ======================================
    // GENERATE PAYSLIP (Admin + SuperAdmin + HR)
    // ======================================
    public function store(Request $request)
    {
        if (!in_array(auth()->user()->role_id, [1, 2, 3])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'month'       => 'required|integer|min:1|max:12',
            'year'        => 'required|integer|min:2000|max:2100',
        ]);

        $employee = Employee::find($request->employee_id);
        
        // 1. Strict Date Validation
        $joinDate = \Carbon\Carbon::parse($employee->date_of_joining);
        // Create date object for the 1st of the requested payslip month
        $payslipStart = \Carbon\Carbon::createFromDate($request->year, $request->month, 1);
        $payslipEnd = $payslipStart->copy()->endOfMonth();

        // If employee joined AFTER the requested month ends, error.
        // e.g. Joined Aug 10. Request June. JoinDate > June 30. Error.
        if ($joinDate->gt($payslipEnd)) {
            return response()->json(['message' => 'Cannot generate payslip. Employee joined ('.$joinDate->format('Y-m-d').') after this month.'], 422);
        }

        // 2. Prevent Duplicates (Idempotency check)
        $existing = Payslip::where('employee_id', $request->employee_id)
            ->where('month', $request->month)
            ->where('year', $request->year)
            ->first();

        if ($existing) {
             return response()->json(['message' => 'Payslip already generated for this month', 'payslip' => $existing], 409);
        }

        $salary = Salary::where('employee_id', $request->employee_id)->first();

        if (!$salary) {
            return response()->json(['message' => 'Salary structure not found for this employee. Please configure salary first.'], 404);
        }

        // 3. Proration Logic (30-day standard)
        $payableDays = 30;

        // If joined in the SAME month
        if ($joinDate->year == $request->year && $joinDate->month == $request->month) {
            // e.g. Joined 20th. Days = 30 - 20 + 1 = 11 days.
            // Cap start day at 30 to avoid negative if joined on 31st (treat 31st as 30th)
            $dayOfJoining = min($joinDate->day, 30);
            $payableDays = 30 - $dayOfJoining + 1;
        }

        $payableDays = max(0, min(30, $payableDays));
        $prorationFactor = $payableDays / 30;

        // 4. Calculate Earnings based on SALARY MODEL (Source of Truth)
        // We do NOT recalculate split from gross. We use the stored values in `salaries` table.
        // This ensures if manual override happened in salary structure, it persists.
        
        $basic = round($salary->basic * $prorationFactor, 2);
        $hra   = round($salary->hra * $prorationFactor, 2);
        $da    = round(($salary->da ?? 0) * $prorationFactor, 2);
        $allowances = round(($salary->allowances ?? 0) * $prorationFactor, 2);
        
        // Gross for the month
        // We sum up the prorated components to avoid rounding drift
        $earnedGross = $basic + $hra + $da + $allowances;

        // 5. Calculate Deductions (PF/ESIC/PTAX rules apply on Earned values)
        // Fetch Policies for flags only
        $policies = \App\Models\PayrollPolicy::all()->pluck('value', 'key');
        $pfEnabled    = filter_var($policies['pf_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $esicEnabled  = filter_var($policies['esic_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $ptaxEnabled  = filter_var($policies['ptax_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $ptaxSlabs    = json_decode($policies['ptax_slabs'] ?? '[]', true);

        $pf = 0;
        $esic = 0;
        $ptax = 0;

        // Note: Salary model stores employer/employee contribution expectations potentially? 
        // Typically PTAX/ESIC/PF are calculated on Earning.
        // If Salary structure has 'pf', 'esic' fields, those are usually "Projected" monthly values.
        // Option A: Use stored Salary deductions * Proration.
        // Option B: Recalculate deductions based on Earned Basic/Gross.
        // Dynamic calculation (Option B) is safer for partial months to ensure compliance (e.g. if salary drops below ESIC limit).
        // Let's stick to Dynamic Calculation for deductions using the flags.

        // PF: 12% of Earned Basic
        if ($pfEnabled && !$employee->pf_opt_out) {
            $pf = round($basic * 0.12, 2);
        }

        // ESIC: 0.75% of Earned Gross 
        // Note: Eligibility check is usually on Monthly Gross. If Full Month Gross <= 21000, they are eligible.
        // Even if prorated salary is low, eligibility is based on rate.
        $isEsicEligible = ($salary->gross_salary <= 21000); 

        if ($esicEnabled && !$employee->esic_opt_out && $isEsicEligible) {
             // Calculate on EARNED gross
             $esic = ceil($earnedGross * 0.0075); 
        }

        // PTAX: on Earned Gross
        if ($ptaxEnabled && !$employee->ptax_opt_out) {
             foreach ($ptaxSlabs as $slab) {
                $min = floatval($slab['min_salary'] ?? 0);
                $maxStr = $slab['max_salary'] ?? null;
                $max = ($maxStr === null || $maxStr === "") ? INF : floatval($maxStr);
                
                // PTAX is usually based on Monthly Gross (Earnings)
                if ($earnedGross >= $min && $earnedGross <= $max) {
                     $ptax = floatval($slab['tax_amount'] ?? 0);
                     break;
                }
            }
        }
        
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
    // DOWNLOAD PAYSLIP PDF (Unified)
    // ======================================
    public function download(Request $request) 
    {
        // Auth Check
        $user = auth()->user();
        $targetEmployeeId = $request->employee_id;

        // If Employee, can only download own AND if they have access enabled
        if ($user->role_id == 4) {
             // Employees cannot download 'all'
             if ($targetEmployeeId === 'all' || $user->employee->id != $targetEmployeeId) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
            
            // CHECK ACCESSS PERMISSION
            if (!$user->employee->payslip_access) {
                return response()->json(['message' => 'Download permission denied for this employee.'], 403);
            }
        }
        
        // Roles 1, 2, 3 allowed if middleware permits.
        // Removed explicit block for Role 3.

        $request->validate([
            'employee_id' => 'required', // Removed exists constraint to allow 'all'
            'start_month' => 'required|integer|min:1|max:12',
            'end_month'   => 'required|integer|min:1|max:12',
            'year'        => 'required|integer',
        ]);

        $query = Payslip::with(['employee.user', 'employee.designation', 'employee.department'])
            ->where('year', $request->year)
            ->whereBetween('month', [$request->start_month, $request->end_month]);

        if ($targetEmployeeId !== 'all') {
            $query->where('employee_id', $targetEmployeeId);
        }
        
        // Order by Employee then Month
        $query->orderBy('employee_id', 'asc')
              ->orderBy('month', 'asc');

        $payslips = $query->get();

        if ($payslips->isEmpty()) {
             return response()->json(['message' => 'No payslips found for the selected range'], 404);
        }

        // Add digital signature info and timestamp to payslips
        $signatureData = [
            'generated_by' => $user->name,
            'generated_at' => now()->format('Y-m-d H:i:s'),
            'company' => 'MIND & MATTER MARKETING SOLUTIONS PRIVATE LIMITED',
            'signature_id' => 'DOC-' . strtoupper(uniqid())
        ];

        // Get password for encryption
        $password = null;
        
        // For single employee download, use their login password
        if ($targetEmployeeId !== 'all') {
            $employee = Employee::with('user')->find($targetEmployeeId);
            if ($employee && $employee->user) {
                // Use last 8 characters of employee code + first 4 of name as visible password hint
                // But encrypt with actual password hash (stored password is hashed, so we'll use a derived key)
                // Since we can't decrypt the password, we'll use employee_code + DOB as password
                $dobPart = $employee->dob ? date('dmY', strtotime($employee->dob)) : '01012000';
                $password = $employee->employee_code . $dobPart;
            }
        }

        // Generate PDF filename
        $filename = 'payslips_' . ($targetEmployeeId === 'all' ? 'ALL' : $targetEmployeeId) . '_' . $request->year . '.pdf';
        
        $pdf = Pdf::loadView('pdf.payslip', compact('payslips', 'signatureData'))
            ->setOption('enable-javascript', true)
            ->setOption('enable-smart-shrinking', true);
        
        // Apply password protection if single employee
        if ($password) {
            $pdf->setOption('user-password', $password)
                ->setOption('owner-password', $password . '_admin')
                ->setOption('encryption', true);
            
            // Add password hint to response header
            $employee = Employee::find($targetEmployeeId);
            $passwordHint = $employee->employee_code . ' + DOB (DDMMYYYY format)';
            
            return $pdf->download($filename)
                ->header('X-Password-Hint', $passwordHint);
        }
        
        return $pdf->download($filename);
    }

    // ======================================
    // VIEW SINGLE PAYSLIP
    // Admin/SuperAdmin/HR → any payslip
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
            // Check Access Permission
            if (!$user->employee->payslip_access) {
                return response()->json(['message' => 'Access to payslips is restricted.'], 403);
            }
        }

        // Role 3 previously blocked. Removing block.

        return response()->json($payslip);
    }

    // ======================================
    // UPDATE PAYSLIP (Admin + SuperAdmin + HR)
    // ======================================
    public function update(Request $request, $id)
    {
        if (!in_array(auth()->user()->role_id, [1, 2, 3])) {
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

        // Recalculate based on manual edit
        $total_earnings = $request->basic_salary + $request->hra + $request->allowances;
        $total_deductions = $request->deductions;
        $net_pay = $total_earnings - $total_deductions;

        // Also update standard components if columns exist, usually mapped 1:1
        // DB columns: basic, hra, pf, esic, ptax.
        // Frontend sends generic "allowances", "deductions".
        // This update is partial. We'll update the main value columns.
        
        $payslip->update([
            'basic'            => $request->basic_salary,
            'hra'              => $request->hra,
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
    // Only Admin + SuperAdmin + HR
    // ======================================
    public function destroy($id)
    {
        if (!in_array(auth()->user()->role_id, [1, 2, 3])) {
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
             // If SuperAdmin calls this, they get their own if they are also employee? 
             // Logic says check role 4. Sticking to old logic.
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $employee = $user->employee;

        if (!$employee) {
            return response()->json(['message' => 'Employee profile not found'], 404);
        }

        // Check Access Permission
        if (!$employee->payslip_access) {
             // Return 403 so frontend can show proper message
             return response()->json(['message' => 'You do not have permission to view payslips. Please contact your administrator.'], 403);
        }

        $payslips = Payslip::where('employee_id', $employee->id)
            ->orderByDesc('year')
            ->orderByDesc('month')
            ->get();

        return response()->json($payslips);
    }
}