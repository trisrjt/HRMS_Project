<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'temp_password',
        'face_data',
        'face_descriptor',
        'role_id',
        'is_active',
        // Permissions
        'can_manage_employees',
        'can_view_employees',
        'can_manage_salaries',
        'can_view_salaries',
        'can_manage_attendance',
        'can_view_attendance',
        'can_manage_leaves',
        'can_view_leaves',
        'can_manage_departments',
        'can_manage_payslips',
        'can_manage_payroll_settings',
        'can_force_checkout',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = ['is_manager'];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'is_active' => 'boolean',
        'can_manage_employees' => 'boolean',
        'can_view_employees' => 'boolean',
        'can_manage_salaries' => 'boolean',
        'can_view_salaries' => 'boolean',
        'can_manage_attendance' => 'boolean',
        'can_view_attendance' => 'boolean',
        'can_manage_leaves' => 'boolean',
        'can_view_leaves' => 'boolean',
        'can_manage_departments' => 'boolean',
        'can_manage_payslips' => 'boolean',
        'can_manage_payroll_settings' => 'boolean',
        'can_force_checkout' => 'boolean',
    ];

    // Relationships (optional)
    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function employee()
    {
        return $this->hasOne(Employee::class, 'user_id');
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    // Accessor: Check if user is a manager (has direct reports)
    public function getIsManagerAttribute()
    {
        if ($this->role_id === 4 && $this->employee) {
            // Check if any employee reports to this user's employee ID
            return Employee::where('reports_to', $this->employee->id)->exists();
        }
        return false;
    }
}