<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Employee;
use App\Models\LeaveType;
use App\Models\LeaveBalance;

class LeaveBalanceSeeder extends Seeder
{
    public function run()
    {
        $employees = Employee::all();
        $leaveTypes = LeaveType::all();

        // Default allocations
        // Adjust IDs based on your actual LeaveType IDs. 
        // Assuming: 1=Sick, 2=Casual, 3=Earned, 4=Unpaid
        $allocations = [
            1 => 12,  // Sick
            2 => 12,  // Casual
            3 => 15,  // Earned
            4 => 365, // Unpaid (Infinite)
        ];

        foreach ($employees as $employee) {
            foreach ($leaveTypes as $type) {
                // Check if balance already exists
                if (!LeaveBalance::where('employee_id', $employee->id)->where('leave_type_id', $type->id)->exists()) {
                    LeaveBalance::create([
                        'employee_id' => $employee->id,
                        'leave_type_id' => $type->id,
                        'allocated_days' => $allocations[$type->id] ?? 0,
                        'used_days' => 0,
                    ]);
                }
            }
        }
    }
}
