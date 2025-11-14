<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Department;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $departments = [
            ['name' => 'Human Resources', 'description' => 'Handles employee relations'],
            ['name' => 'Finance', 'description' => 'Manages company finances'],
            ['name' => 'IT', 'description' => 'Responsible for technology and infrastructure'],
        ];

        foreach ($departments as $department) {
            Department::firstOrCreate(['name' => $department['name']], $department);
        }
    }
}