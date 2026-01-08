<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class GenerateMonthlyPayslips extends Command
{
    protected $signature = 'payroll:generate-payslips {month?} {year?}';
    protected $description = 'Generate payslips for all eligible employees for a given month';

    public function handle()
    {
        $month = $this->argument('month') ?? now()->month;
        $year = $this->argument('year') ?? now()->year;

        $this->info("Starting Payslip Generation for {$month}/{$year}...");

        // Fetch active employees who HAVE a salary structure via User relation
        $employees = \App\Models\Employee::whereHas('user', function($q) {
            $q->where('is_active', true);
        })
        ->whereHas('currentSalary') // Strict check: Must have salary structure
        ->with('currentSalary')
        ->get();

        $count = 0;
        $errors = 0;

        // Fetch Policies once
        $policies = \App\Models\PayrollPolicy::all()->pluck('value', 'key');
        // Basic % from policies is used if Salary breakdown logic needs it, 
        // BUT we prioritize stored Salary components.
        // Use Global Policy primarily for Tax Slabs and Toggle checks if dependent.
        
        $ptaxSlabsVal = $policies['ptax_slabs'] ?? '[]';
        $ptaxSlabs = is_string($ptaxSlabsVal) ? json_decode($ptaxSlabsVal, true) : $ptaxSlabsVal;

        foreach ($employees as $employee) {
            try {
                // 1. DOJ Validation
                $joinDate = \Carbon\Carbon::parse($employee->date_of_joining);
                $payslipDate = \Carbon\Carbon::createFromDate($year, $month, 1);
                
                // If joined after the end of this month, skip
                if ($joinDate->gt($payslipDate->copy()->endOfMonth())) {
                    continue;
                }

                // 2. Idempotency Check
                if (\App\Models\Payslip::where('employee_id', $employee->id)
                    ->where('month', $month)
                    ->where('year', $year)
                    ->exists()) {
                    // Already exists, skip
                    continue;
                }

                // 3. Salary Structure
                $salary = $employee->currentSalary;
                if (!$salary) {
                    $this->warn("Skipping Employee {$employee->employee_code}: No Salary Structure");
                    $errors++;
                    continue;
                }

                // 4. Proration Logic (30-day fixed)
                $payableDays = 30;
                if ($joinDate->isSameMonth($payslipDate)) {
                    $dayOfJoining = min($joinDate->day, 30);
                    $payableDays = 30 - $dayOfJoining + 1;
                }
                $payableDays = max(0, min(30, $payableDays));
                $prorationFactor = $payableDays / 30;

                // 5. Calculate Components (Based on Stored Salary)
                // We use the Stored Salary as the "Monthly Rate" and apply proration
                
                $basic = round($salary->basic * $prorationFactor, 2);
                $hra   = round($salary->hra * $prorationFactor, 2);
                $da    = round(($salary->da ?? 0) * $prorationFactor, 2);
                $allowances = round(($salary->allowances ?? 0) * $prorationFactor, 2);
                
                $earnedGross = $basic + $hra + $da + $allowances; 

                // 6. Deductions (Recalculate based on EARNED amounts or fixed?)
                // Usually PF/ESIC are calculated on Earned. PTAX on Earned Gross.
                
                $pf = 0;
                if (!$employee->pf_opt_out && filter_var($policies['pf_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
                    $pf = round($basic * 0.12, 2);
                }

                $esic = 0;
                if (!$employee->esic_opt_out && filter_var($policies['esic_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
                     // ESIC Rule: On Gross. Limit usually 21000 PRE-PRORATION or POST? 
                     // Usually eligibility is checked on Monthly Rate, but deduction is on Earned.
                     // Simple logic used in Controller: 0.75% of Earned Gross.
                     if ($salary->gross_salary <= 21000) { // Check eligibility on full rate
                         $esic = ceil($earnedGross * 0.0075);
                     }
                }

                $ptax = 0;
                if (!$employee->ptax_opt_out && filter_var($policies['ptax_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
                    // PTAX Slabs usually on Earned Gross
                    foreach ($ptaxSlabs as $slab) {
                        $min = floatval($slab['min_salary'] ?? 0);
                        $maxStr = $slab['max_salary'] ?? null;
                        $max = ($maxStr === null || $maxStr === "") ? INF : floatval($maxStr);
                        if ($earnedGross >= $min && $earnedGross <= $max) {
                            $ptax = floatval($slab['tax_amount'] ?? 0);
                            break;
                        }
                    }
                }

                $totalDeductions = $pf + $esic + $ptax;
                $netPay = $earnedGross - $totalDeductions;

                // 7. Store
                \App\Models\Payslip::create([
                    'employee_id'      => $employee->id,
                    'month'            => $month,
                    'year'             => $year,
                    'days_worked'      => $payableDays,
                    'gross_salary'     => $earnedGross, // Earned Gross
                    'basic'            => $basic,
                    'hra'              => $hra,
                    'da'               => $da,
                    'allowances'       => $allowances,
                    'pf'               => $pf,
                    'esic'             => $esic,
                    'ptax'             => $ptax,
                    'total_earnings'   => $earnedGross,
                    'total_deductions' => $totalDeductions,
                    'net_pay'          => $netPay,
                    'generated_on'     => now(),
                ]);

                $count++;

            } catch (\Exception $e) {
                $this->error("Failed for Employee {$employee->id}: " . $e->getMessage());
                $errors++;
            }
        }

        $this->info("Completed. Generated: {$count}. Errors/Skipped: {$errors}.");
    }
}
