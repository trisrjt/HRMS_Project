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
                'is_active' => true,
            ]
        );
        User::firstOrCreate(
    ['email' => 'admin@company.com'],
    [
        'name' => 'Admin User',
        'password' => Hash::make('password'),
        'role_id' => 2,
        'is_active' => true,
    ]
);

User::firstOrCreate(
    ['email' => 'hr@company.com'],
    [
        'name' => 'HR User',
        'password' => Hash::make('password'),
        'role_id' => 3,
        'is_active' => true,
    ]
);

User::firstOrCreate(
    ['email' => 'employee@company.com'],
    [
        'name' => 'Employee User',
        'password' => Hash::make('password'),
        'role_id' => 4,
        'is_active' => true,
    ]
);

    }
}