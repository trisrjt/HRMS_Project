<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Attendance;
use App\Models\Employee;

class AttendanceSeeder extends Seeder
{
    public function run(): void
    {
        $employees = Employee::all();

        // Create attendance records for the last 30 days
        foreach ($employees as $employee) {
            for ($i = 0; $i < 30; $i++) {
                $date = now()->subDays($i)->toDateString();
                
                // Skip weekends (Saturday = 6, Sunday = 0)
                $dayOfWeek = now()->subDays($i)->dayOfWeek;
                if ($dayOfWeek == 0 || $dayOfWeek == 6) {
                    continue;
                }
                
                // Randomly make some days absent (10% chance)
                $isAbsent = rand(1, 10) === 1;
                
                if ($isAbsent) {
                    Attendance::create([
                        'employee_id' => $employee->id,
                        'date' => $date,
                        'status' => 'Absent',
                        'working_hours' => 0,
                    ]);
                } else {
                    // Random check-in time between 8:30 and 9:30
                    $checkInHour = 9;
                    $checkInMinute = rand(0, 30);
                    $checkIn = sprintf('%02d:%02d:00', $checkInHour, $checkInMinute);
                    
                    // Random check-out time between 17:00 and 18:00
                    $checkOutHour = 17;
                    $checkOutMinute = rand(0, 59);
                    $checkOut = sprintf('%02d:%02d:00', $checkOutHour, $checkOutMinute);
                    
                    // Calculate working hours
                    $workingHours = ($checkOutHour - $checkInHour) + ($checkOutMinute - $checkInMinute) / 60;
                    
                    // Determine status
                    $status = 'Present';
                    if ($checkInMinute > 15) {
                        $status = 'Late';
                    }
                    
                    Attendance::create([
                        'employee_id' => $employee->id,
                        'date' => $date,
                        'check_in' => $checkIn,
                        'check_out' => $checkOut,
                        'working_hours' => round($workingHours, 2),
                        'status' => $status,
                    ]);
                }
            }
        }
    }
}