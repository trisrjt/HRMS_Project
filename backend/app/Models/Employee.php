<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'department_id',
        'employee_code',
        'phone',
        'address',
        'date_of_joining',
        'designation_id',
        'salary',
        'dob',
        'aadhar_number',
        'pan_number',
        'emergency_contact',
        'gender',
        'marital_status',
        'profile_photo',
        'reports_to',
        'pf_opt_out',
        'esic_opt_out',
        'ptax_opt_out',
        'joining_category',
        'leave_policy_id',
    ];

    // Relationship: Employee → User
    public function user()
{
    return $this->belongsTo(User::class, 'user_id');
}


    // Relationship: Employee → Department
    public function department()
    {
        return $this->belongsTo(Department::class);
    }
    
    public function designation()
    {
        return $this->belongsTo(Designation::class);
    }
   
    public function salaries()
    {
        return $this->hasMany(Salary::class, 'employee_id');
    }

    public function currentSalary()
    {
        return $this->hasOne(Salary::class, 'employee_id')->latestOfMany();
    }

    public function leavePolicy()
    {
        return $this->belongsTo(LeavePolicy::class, 'leave_policy_id');
    }

    public function leaves()
    {
        return $this->hasMany(Leave::class);
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

    // Hierarchy: Reports To (Manager)
    public function manager()
    {
        return $this->belongsTo(Employee::class, 'reports_to');
    }

    // Hierarchy: Direct Reports
    public function directReports()
    {
        return $this->hasMany(Employee::class, 'reports_to');
    }

    // Hierarchy: All Subordinates (Recursive)
    public function allSubordinates()
    {
        return $this->directReports()->with('allSubordinates');
    }

    // Helper: Get flat list of all subordinate IDs (Iterative BFS - Safe from Recursion Limits)
    public function getAllSubordinateIds()
    {
        $allSubordinateIds = collect();
        $queue = [$this->id];
        $visited = [$this->id]; // Track visited to avoid cycles

        while (!empty($queue)) {
            $currentId = array_shift($queue);

            // Fetch direct reports for the current employee
            // Using ID only is lighter
            $directReports = self::where('reports_to', $currentId)->pluck('id');

            foreach ($directReports as $reportId) {
                if (!in_array($reportId, $visited)) {
                    $visited[] = $reportId;
                    $queue[] = $reportId;
                    $allSubordinateIds->push($reportId);
                }
            }
        }

        return $allSubordinateIds->unique();
    }
}