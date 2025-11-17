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
        'role_id',
        'employee_code',
        'phone',
        'address',
        'date_of_joining',
        'designation',
        'salary',
    ];

    // Return ONLY id, name, email to match frontend expectations
    public function user()
    {
        return $this->belongsTo(User::class)->select('id', 'name', 'email');
    }

    // Only return id + name
    public function department()
    {
        return $this->belongsTo(Department::class)->select('id', 'name');
    }

    // Only return id + name
    public function role()
    {
        return $this->belongsTo(Role::class)->select('id', 'name');
    }
}