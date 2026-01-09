<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'date',
        'check_in',
        'check_out',
        'working_hours',
        'status',
        'check_in_latitude',
        'check_in_longitude',
        'check_out_latitude',
        'check_out_longitude',
        'device_id',
        'device_type',
        'browser',
        'ip_address',
        'checked_in_by',
        'checked_out_by',
        'checkout_type',
        'overtime_start',
        'overtime_end',
        'overtime_hours'
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}