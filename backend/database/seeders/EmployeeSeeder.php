<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Employee;

class EmployeeSeeder extends Seeder
{
    public function run(): void
    {
        // Super Admin Employee Record
        Employee::firstOrCreate(
            ['employee_code' => 'EMP001'],
            [
                'user_id' => 1,
                'department_id' => 1,
                'phone' => '9876543210',
                'address' => 'Bangalore, India',
                'date_of_joining' => '2024-01-10',
                'designation' => 'Super Admin',
                'salary' => 100000,
            ]
        );

        // Admin Employee Record
        Employee::firstOrCreate(
            ['employee_code' => 'EMP002'],
            [
                'user_id' => 2,
                'department_id' => 1,
                'phone' => '9000000001',
                'address' => 'Mumbai, India',
                'date_of_joining' => '2024-02-15',
                'designation' => 'Admin Manager',
                'salary' => 80000,
            ]
        );

        // HR Employee Record
        Employee::firstOrCreate(
            ['employee_code' => 'EMP003'],
            [
                'user_id' => 3,
                'department_id' => 1,
                'phone' => '9000000002',
                'address' => 'Delhi, India',
                'date_of_joining' => '2024-03-20',
                'designation' => 'HR Manager',
                'salary' => 70000,
            ]
        );

        // Regular Employee Record
        Employee::firstOrCreate(
            ['employee_code' => 'EMP004'],
            [
                'user_id' => 4,
                'department_id' => 1,
                'phone' => '9000000003',
                'address' => 'Pune, India',
                'date_of_joining' => '2024-04-25',
                'designation' => 'Software Developer',
                'salary' => 60000,
            ]
        );
    }
}