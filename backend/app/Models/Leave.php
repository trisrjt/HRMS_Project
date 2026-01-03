<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Leave extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'leave_type_id',
        'start_date',
        'end_date',
        'reason',
        'status',
        'approved_by',
        'approved_start_date',
        'approved_end_date',
        'approved_days',
        'withdrawn_at'
    ];

    // Employee who applied leave
    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    // Type of leave (sick, casual etc.)
    public function leaveType()
    {
        return $this->belongsTo(LeaveType::class);
    }

    // Approver (HR/Admin/SuperAdmin)
    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}