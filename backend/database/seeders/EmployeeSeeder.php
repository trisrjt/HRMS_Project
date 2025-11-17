<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Employee;

class EmployeeSeeder extends Seeder
{
    public function run(): void
    {
        Employee::firstOrCreate(
            ['employee_code' => 'EMP001'],  // prevent duplicate
            [
                'user_id' => 1,
                'department_id' => 1,
                'role_id' => 1,
                'phone' => '9876543210',
                'address' => 'Bangalore, India',
                'date_of_joining' => '2024-01-10',
                'designation' => 'HR Executive',
                'salary' => 50000,
            ]
        );
    }
}