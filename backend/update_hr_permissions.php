<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Update Admin User permissions (Role 2)
$adminUser = \App\Models\User::where('role_id', 2)->first();

if ($adminUser) {
    $adminUser->can_view_employees = true;
    $adminUser->can_manage_employees = true;
    $adminUser->can_view_attendance = true;
    $adminUser->can_manage_attendance = true;
    $adminUser->can_view_leaves = true;
    $adminUser->can_manage_leaves = true;
    $adminUser->can_view_salaries = true;
    $adminUser->can_manage_salaries = true;
    $adminUser->can_manage_departments = true;
    $adminUser->can_manage_payslips = true;
    $adminUser->save();
    
    echo "✓ Updated Admin User ({$adminUser->email}) permissions:\n";
    echo "  - can_view_employees: " . ($adminUser->can_view_employees ? 'true' : 'false') . "\n";
    echo "  - can_manage_employees: " . ($adminUser->can_manage_employees ? 'true' : 'false') . "\n";
    echo "  - can_view_attendance: " . ($adminUser->can_view_attendance ? 'true' : 'false') . "\n";
    echo "  - can_manage_attendance: " . ($adminUser->can_manage_attendance ? 'true' : 'false') . "\n";
    echo "  - can_view_leaves: " . ($adminUser->can_view_leaves ? 'true' : 'false') . "\n";
    echo "  - can_manage_leaves: " . ($adminUser->can_manage_leaves ? 'true' : 'false') . "\n";
    echo "  - can_view_salaries: " . ($adminUser->can_view_salaries ? 'true' : 'false') . "\n";
    echo "  - can_manage_salaries: " . ($adminUser->can_manage_salaries ? 'true' : 'false') . "\n";
    echo "\n";
} else {
    echo "✗ No Admin user found with role_id = 2\n";
}

// Update HR User permissions (Role 3)
$hrUser = \App\Models\User::where('role_id', 3)->first();

if ($hrUser) {
    $hrUser->can_view_employees = true;
    $hrUser->can_manage_employees = true;
    $hrUser->can_view_attendance = true;
    $hrUser->can_manage_attendance = true;
    $hrUser->can_view_leaves = true;
    $hrUser->can_manage_leaves = true;
    $hrUser->can_view_salaries = true;
    $hrUser->save();
    
    echo "✓ Updated HR User ({$hrUser->email}) permissions:\n";
    echo "  - can_view_employees: " . ($hrUser->can_view_employees ? 'true' : 'false') . "\n";
    echo "  - can_manage_employees: " . ($hrUser->can_manage_employees ? 'true' : 'false') . "\n";
    echo "  - can_view_attendance: " . ($hrUser->can_view_attendance ? 'true' : 'false') . "\n";
    echo "  - can_manage_attendance: " . ($hrUser->can_manage_attendance ? 'true' : 'false') . "\n";
    echo "  - can_view_leaves: " . ($hrUser->can_view_leaves ? 'true' : 'false') . "\n";
    echo "  - can_manage_leaves: " . ($hrUser->can_manage_leaves ? 'true' : 'false') . "\n";
    echo "  - can_view_salaries: " . ($hrUser->can_view_salaries ? 'true' : 'false') . "\n";
} else {
    echo "✗ No HR user found with role_id = 3\n";
}
