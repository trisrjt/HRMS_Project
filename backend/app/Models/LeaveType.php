<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LeaveType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'applicable_gender',
        'max_days', // Keeping untounched for backward compatibility if used
        'description',
        'max_days_per_year',
        'carry_forward_allowed',
        'allow_partial_approval',
        'auto_approve',
        'requires_approval',
        'is_paid',
        'available_during_probation'
    ];
}