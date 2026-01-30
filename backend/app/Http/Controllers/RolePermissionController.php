<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class RolePermissionController extends Controller
{
    /**
     * Get all users by role ID with their permissions
     */
    public function getUsersByRole($roleId)
    {
        // Validate that roleId is HR (3) or Admin (2)
        if (!in_array($roleId, [2, 3])) {
            return response()->json(['message' => 'Invalid role ID'], 400);
        }

        $users = User::where('role_id', $roleId)
            ->where('is_active', true)
            ->select([
                'id',
                'name',
                'email',
                'role_id',
                'can_manage_employees',
                'can_view_employees',
                'can_manage_salaries',
                'can_view_salaries',
                'can_manage_attendance',
                'can_view_attendance',
                'can_manage_leaves',
                'can_view_leaves',
                'can_manage_departments',
                'can_manage_payslips'
            ])
            ->get();

        return response()->json($users);
    }

    /**
     * Get role-level permissions configuration
     * (aggregated permissions that apply to all users of a role)
     */
    public function getRolePermissions()
    {
        $roles = [
            [
                'id' => 2,
                'name' => 'Admin',
                'permissions' => $this->getAggregatedPermissions(2)
            ],
            [
                'id' => 3,
                'name' => 'HR',
                'permissions' => $this->getAggregatedPermissions(3)
            ]
        ];

        return response()->json($roles);
    }

    /**
     * Get aggregated permissions for a role (if ALL users of that role have a permission, it's true)
     */
    private function getAggregatedPermissions($roleId)
    {
        $users = User::where('role_id', $roleId)->where('is_active', true)->get();

        if ($users->count() === 0) {
            return [
                'can_manage_leaves' => false,
                'can_view_leaves' => false,
                'can_manage_attendance' => false,
                'can_view_attendance' => false,
                'can_manage_employees' => false,
                'can_view_employees' => false,
                'can_manage_salaries' => false,
                'can_view_salaries' => false,
                'can_manage_departments' => false,
                'can_manage_payslips' => false,
                'can_manage_payroll_settings' => false,
            ];
        }

        // Check if ALL users have each permission
        return [
            'can_manage_leaves' => $users->every(fn($u) => $u->can_manage_leaves),
            'can_view_leaves' => $users->every(fn($u) => $u->can_view_leaves),
            'can_manage_attendance' => $users->every(fn($u) => $u->can_manage_attendance),
            'can_view_attendance' => $users->every(fn($u) => $u->can_view_attendance),
            'can_manage_employees' => $users->every(fn($u) => $u->can_manage_employees),
            'can_view_employees' => $users->every(fn($u) => $u->can_view_employees),
            'can_manage_salaries' => $users->every(fn($u) => $u->can_manage_salaries),
            'can_view_salaries' => $users->every(fn($u) => $u->can_view_salaries),
            'can_manage_departments' => $users->every(fn($u) => $u->can_manage_departments),
            'can_manage_payslips' => $users->every(fn($u) => $u->can_manage_payslips),
            'can_manage_payroll_settings' => $users->every(fn($u) => $u->can_manage_payroll_settings),
        ];
    }

    /**
     * Update permissions for all users of a specific role
     */
    public function updateRolePermissions(Request $request, $roleId)
    {
        // Validate that roleId is HR (3) or Admin (2)
        if (!in_array($roleId, [2, 3])) {
            return response()->json(['message' => 'Invalid role ID'], 400);
        }

        $validated = $request->validate([
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
        ]);

        // Update all users of this role
        $updated = User::where('role_id', $roleId)
            ->where('is_active', true)
            ->update($validated);

        return response()->json([
            'message' => 'Permissions updated successfully',
            'updated_count' => $updated
        ]);
    }

    /**
     * Get list of available permissions with descriptions
     */
    public function getAvailablePermissions()
    {
        return response()->json([
            [
                'key' => 'can_manage_leaves',
                'name' => 'Manage Leaves',
                'description' => 'Approve or reject leave requests',
                'category' => 'Leaves'
            ],
            [
                'key' => 'can_view_leaves',
                'name' => 'View Leaves',
                'description' => 'View all leave applications',
                'category' => 'Leaves'
            ],
            [
                'key' => 'can_manage_attendance',
                'name' => 'Manage Attendance',
                'description' => 'Mark or edit attendance records',
                'category' => 'Attendance'
            ],
            [
                'key' => 'can_view_attendance',
                'name' => 'View Attendance',
                'description' => 'View all attendance records',
                'category' => 'Attendance'
            ],
            [
                'key' => 'can_manage_employees',
                'name' => 'Manage Employees',
                'description' => 'Add, edit or remove employees',
                'category' => 'Employees'
            ],
            [
                'key' => 'can_view_employees',
                'name' => 'View Employees',
                'description' => 'View employee information',
                'category' => 'Employees'
            ],
            [
                'key' => 'can_manage_salaries',
                'name' => 'Manage Salaries',
                'description' => 'Update salary information',
                'category' => 'Payroll'
            ],
            [
                'key' => 'can_view_salaries',
                'name' => 'View Salaries',
                'description' => 'View salary and payroll data',
                'category' => 'Payroll'
            ],
            [
                'key' => 'can_manage_departments',
                'name' => 'Manage Departments',
                'description' => 'Create or edit departments',
                'category' => 'Organization'
            ],
            [
                'key' => 'can_manage_payslips',
                'name' => 'Manage Payslips',
                'description' => 'Generate and send payslips',
                'category' => 'Payroll'
            ],
            [
                'key' => 'can_manage_payroll_settings',
                'name' => 'Manage Payroll Settings',
                'description' => 'Configure payroll policies and settings',
                'category' => 'Payroll'
            ],
        ]);
    }
}
