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
        'designation',
        'salary',
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
   
    public function salaries()
    {
        return $this->hasMany(Salary::class, 'employee_id');
    }

    public function currentSalary()
    {
        return $this->hasOne(Salary::class, 'employee_id')->latestOfMany();
    }
}