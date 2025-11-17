<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payslip extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'month',
        'year',
        'total_earnings',
        'total_deductions',
        'net_pay',
        'generated_on',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}