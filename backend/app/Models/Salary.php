<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Salary extends Model
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

    // Relationship: Each salary belongs to one employee
    
    public function employee()
{
    return $this->belongsTo(Employee::class);
}

}