<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['name' => 'Super Admin', 'description' => 'Has full access to the system'],
            ['name' => 'Admin', 'description' => 'Can manage users, attendance, and leaves'],
            ['name' => 'HR', 'description' => 'Can manage HR functions, recruitment, and leaves'],
            ['name' => 'Employee', 'description' => 'Can manage own attendance and payroll'],
        ];

        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role['name']], $role);
        }
    }
}