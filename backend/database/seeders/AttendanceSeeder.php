<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Attendance;
use App\Models\Employee;

class AttendanceSeeder extends Seeder
{
    public function run(): void
    {
        $employee = Employee::first();

        if ($employee) {
            Attendance::create([
                'employee_id' => $employee->id,
                'date' => now()->toDateString(),
                'check_in' => '09:00:00',
                'check_out' => '17:00:00',
                'working_hours' => 8.0,
                'status' => 'Present',
            ]);
        }
    }
}