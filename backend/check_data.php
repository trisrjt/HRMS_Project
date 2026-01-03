<?php

use App\Models\Designation;
use App\Models\Employee;
use Illuminate\Support\Facades\DB;

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$columns = Schema::getColumnListing('employees');
echo "Columns in employees table: " . implode(', ', $columns) . "\n";

$totalEmployees = DB::table('employees')->count();
echo "Total Employees: " . $totalEmployees . "\n";

$designationCount = DB::table('designations')->count();
echo "Total Designations: " . $designationCount . "\n";

if (in_array('designation_id', $columns)) {
    $employeesWithId = DB::table('employees')->whereNotNull('designation_id')->count();
    echo "Employees with non-null designation_id: " . $employeesWithId . "\n";
}

if (in_array('designation', $columns)) {
    $employeesWithText = DB::table('employees')->whereNotNull('designation')->where('designation', '!=', '')->count();
    echo "Employees with non-empty text designation: " . $employeesWithText . "\n";
} else {
    echo "Column 'designation' DOES NOT EXIST in employees table.\n";
}

if ($designationCount > 0) {
    echo "\nSample Designations:\n";
    $samples = DB::table('designations')->limit(5)->get();
    foreach ($samples as $d) {
        echo "- ID: {$d->id}, Name: {$d->name}\n";
    }
}
