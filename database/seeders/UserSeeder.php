<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@hrms.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password'),
                'role_id' => 1,
                'department_id' => 1,
                'phone' => '9876543210',
                'employee_code' => 'EMP001',
                'join_date' => '2023-01-01',
            ]
        );
    }
}