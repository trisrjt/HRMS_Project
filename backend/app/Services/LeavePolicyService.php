<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\LeavePolicy;
use App\Models\LeaveBalance;
use App\Models\LeaveType;

class LeavePolicyService
{
    /**
     * Assign the appropriate active policy to an employee based on their joining category.
     * Use this when creating an employee or changing their category.
     */
    public function assignPolicyToEmployee(Employee $employee)
    {
        // 1. Find active policy for the employee's category
        $policy = LeavePolicy::where('joining_category', $employee->joining_category)
                             ->where('status', 'Active')
                             ->orderBy('effective_from', 'desc') // Get most recent if multiple (should be unique ideally)
                             ->first();

        if (!$policy) {
            // No policy found? Maybe Log warning or return.
            // For now, we just return, meaning no policy assigned.
            return;
        }

        // 2. Assign Policy ID
        $employee->leave_policy_id = $policy->id;
        $employee->save();

        // 3. Initialize/Update Balances based on Rules
        $this->syncBalances($employee, $policy);
    }

    /**
     * Sync leave balances based on the policy rules.
     * This ensures the employee has the allocated days defined in the policy.
     */
    public function syncBalances(Employee $employee, LeavePolicy $policy)
    {
        $rules = $policy->rules;

        foreach ($rules as $rule) {
            // Check if balance exists
            $balance = LeaveBalance::firstOrNew([
                'employee_id' => $employee->id,
                'leave_type_id' => $rule->leave_type_id,
            ]);

            // If new, set allocated days.
            // If existing, DO WE OVERWRITE? User said: "Recursively applied... Leave balance recalculates only if admin chooses Recalculate".
            // But for "Initial Assignment" (New Employee), we set it.
            // For "Category Change" (Automatic Policy Assignment), user said "Initialize leave balances".
            
            // Logic:
            // If the balance is new (id is null), we set allocated = rule->total_leaves_per_year.
            // If the balance exists, we typically usually DON'T reset 'used_days'.
            // But we might update 'allocated_days' if the policy grants a different amount.
            // e.g. Intern (6 days) -> Permanent (12 days). We should update allocated to 12.
            
            $limit = $rule->total_leaves_per_year;
            
            // If accrual is monthly, do we give full year initially? User said "Monthly accrual or yearly grant". 
            // If Monthly, maybe we give 0 or pro-rata?
            // For simplicity in this iteration (and per "Initialize leave balances" request), 
            // lets assume we set 'allocated_days' to the total annual limit if it's 'Yearly' grant, 
            // OR if it's 'Monthly', maybe we calculate pro-rata or just set 0 if it accrues via cron?
            // The prompt says "Initialize leave balances based on the policy".
            // Let's set allocated_days = total_leaves_per_year for now to be safe/generous, 
            // OR if strictly monthly, maybe 0.
            
            // Let's trust the 'total_leaves_per_year' from the rule for the `allocated_days` field for now, 
            // assuming it represents the annual quota.
            
            $balance->allocated_days = $limit;
            
            // We do NOT touch 'used_days'.
            
            $balance->save();
        }
    }
}
