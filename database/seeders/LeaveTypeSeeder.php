<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\LeaveType;

class LeaveTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['name' => 'Sick Leave', 'max_days' => 10, 'description' => 'Leave taken when sick or unwell.'],
            ['name' => 'Casual Leave', 'max_days' => 7, 'description' => 'Leave for personal or urgent matters.'],
            ['name' => 'Paid Leave', 'max_days' => 12, 'description' => 'Leave with salary benefits.'],
            ['name' => 'Maternity Leave', 'max_days' => 180, 'description' => 'For female employees.'],
        ];

        foreach ($types as $type) {
            LeaveType::firstOrCreate(['name' => $type['name']], $type);
        }
    }
}