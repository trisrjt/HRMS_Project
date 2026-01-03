<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalaryHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'basic',
        'hra',
        'pf',
        'esic',
        'ptax',
        'da',
        'allowances',
        'deductions',
        'gross_salary',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
