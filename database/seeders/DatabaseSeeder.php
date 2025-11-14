<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            DepartmentSeeder::class,
            UserSeeder::class,
            EmployeeSeeder::class,
            AttendanceSeeder::class,
            LeaveTypeSeeder::class,
            SettingSeeder::class,
        ]);
    }
}