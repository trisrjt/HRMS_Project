<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = \App\Models\User::where('email', 'a1@gmail.com')->first();
if (!$user) {
    echo "User not found\n";
    exit;
}

echo "User ID: " . $user->id . "\n";
$employee = $user->employee;
if (!$employee) {
    echo "Employee profile not found\n";
    exit;
}

echo "Employee ID: " . $employee->id . "\n";
echo "Department ID: " . ($employee->department_id ?? 'NULL') . "\n";

$user->load(['employee.department', 'employee.designation', 'role']);
echo "JSON Output:\n";
echo json_encode($user, JSON_PRETTY_PRINT);

