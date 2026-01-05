<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LeavePolicyRule extends Model
{
    use HasFactory;

    protected $fillable = [
        'leave_policy_id',
        'leave_type_id',
        'total_leaves_per_year',
        'accrual_frequency',
        'probation_restriction',
        'available_during_probation',
        'allow_partial_leave',
        'carry_forward_allowed',
        'max_carry_forward',
        'requires_approval',
        'auto_approve',
    ];

    protected $casts = [
        'total_leaves_per_year' => 'float',
        'probation_restriction' => 'boolean',
        'available_during_probation' => 'boolean',
        'allow_partial_leave' => 'boolean',
        'carry_forward_allowed' => 'boolean',
        'max_carry_forward' => 'float',
        'requires_approval' => 'boolean',
        'auto_approve' => 'boolean',
    ];

    public function policy()
    {
        return $this->belongsTo(LeavePolicy::class, 'leave_policy_id');
    }

    public function leaveType()
    {
        return $this->belongsTo(LeaveType::class, 'leave_type_id');
    }
}
