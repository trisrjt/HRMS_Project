<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    use HasFactory;

    // ✅ Allow mass assignment for these fields
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

    // ✅ Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function role()
    {
        return $this->belongsTo(Role::class);
    }
}