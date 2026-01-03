<?php
// Find the employee
$employee = App\Models\Employee::whereHas('user', function($q) {
    $q->where('name', 'like', '%Ravinn Kumar%');
})->first();

if (!$employee) {
    echo "Employee 'Ravinn Kumar' not found.\n";
    exit;
}

echo "Employee: " . $employee->user->name . " (ID: " . $employee->id . ")\n";
echo "---------------------------------------------------\n";

// Fetch valid leaves
$leaves = App\Models\Leave::where('employee_id', $employee->id)
    ->whereIn('status', ['Approved', 'Partially Approved'])
    ->get();

$totalDays = 0;

foreach ($leaves as $leave) {
    echo "Leave ID: " . $leave->id . "\n";
    echo "  Type: " . ($leave->leaveType->name ?? 'N/A') . "\n";
    echo "  Status: " . $leave->status . "\n";
    echo "  DB approved_days: " . ($leave->approved_days ?? 'NULL') . "\n";
    
    $days = 0;
    if ($leave->status === 'Approved') {
        $start = new DateTime($leave->start_date);
        $end = new DateTime($leave->end_date);
        $diff = $start->diff($end);
        $days = $diff->days + 1;
        echo "  Dates: " . $leave->start_date . " to " . $leave->end_date . "\n";
        echo "  Calc: Full Approval (Diff + 1) = $days days\n";
    } elseif ($leave->status === 'Partially Approved') {
        $days = $leave->approved_days;
        echo "  Approved Dates: " . $leave->approved_start_date . " to " . $leave->approved_end_date . "\n";
        echo "  Calc: Partial Approval Field = $days days\n";
    }
    
    $totalDays += $days;
    echo "---------------------------------------------------\n";
}

echo "TOTAL CALCULATED DAYS: " . $totalDays . "\n";
