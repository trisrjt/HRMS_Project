<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

use App\Models\Employee;

echo "Checking for Employees with NULL designation_id...\n";

$count = Employee::whereNull('designation_id')->count();
$total = Employee::count();

echo "Total Employees: $total\n";
echo "Employees with NULL designation_id: $count\n";

// Check if 'designation' column exists
$hasLegacyColumn = \Illuminate\Support\Facades\Schema::hasColumn('employees', 'designation');
echo "Legacy 'designation' column exists? " . ($hasLegacyColumn ? "YES" : "NO") . "\n";

if ($count > 0) {
    echo "List of Employees with NULL designation_id:\n";
    $employees = Employee::whereNull('designation_id')->with('user')->get();
    foreach ($employees as $emp) {
        $legacyVal = $hasLegacyColumn ? $emp->designation : 'N/A (Column missing)'; // Note: Model accessor might conflict if relationship exists
        // Use raw query to avoid accessor
        if ($hasLegacyColumn) {
            $raw = \Illuminate\Support\Facades\DB::table('employees')->where('id', $emp->id)->value('designation');
            $legacyVal = $raw;
        }
        
        echo "- ID: {$emp->id}, Name: " . ($emp->user ? $emp->user->name : 'N/A') . ", Legacy Designation: '$legacyVal'\n";
    }
} else {
    echo "All employees have valid designations linked.\n";
}
