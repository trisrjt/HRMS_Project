<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Services\LeavePolicyService;

class UserController extends Controller
{
    protected $leavePolicyService;

    public function __construct(LeavePolicyService $leavePolicyService)
    {
        $this->leavePolicyService = $leavePolicyService;
    }
    public function me(Request $request)
    {
        $user = $request->user();
        
        // Load relationships - avoid loading designation if it doesn't exist
        $user->load(['employee.department', 'employee.manager.user', 'role']);

        // Format response
        $permissions = [];
        $permissionFields = [
            'can_manage_employees', 'can_view_employees',
            'can_manage_salaries', 'can_view_salaries',
            'can_manage_attendance', 'can_view_attendance',
            'can_manage_leaves', 'can_view_leaves',
            'can_manage_departments', 'can_manage_payslips'
        ];
        
        foreach ($permissionFields as $field) {
            if ($user->$field) {
                $permissions[] = $field;
            }
        }

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role ? $user->role->name : null,
            'role_id' => $user->role_id,
            'permissions' => $permissions,
            'employee' => $user->employee ? [
                'employee_code' => $user->employee->employee_code,
                'designation' => $user->employee->designation ?? null,
                'department' => $user->employee->department ?? null,
                'phone' => $user->employee->phone,
                'address' => $user->employee->address,
                'date_of_joining' => $user->employee->date_of_joining,
                'dob' => $user->employee->dob,
                'gender' => $user->employee->gender,
                'marital_status' => $user->employee->marital_status,
                'emergency_contact' => $user->employee->emergency_contact,
                'aadhar_number' => $user->employee->aadhar_number,
                'pan_number' => $user->employee->pan_number,
                'profile_photo' => $user->employee->profile_photo,
                'joining_category' => $user->employee->joining_category,
                'probation_months' => $user->employee->probation_months,
                'status' => $user->is_active ? 'Active' : 'Inactive',
                'manager' => $user->employee->manager ? [
                    'name' => $user->employee->manager->user->name,
                    'email' => $user->employee->manager->user->email,
                ] : null,
            ] : null,
            'hr_email' => \App\Models\User::where('role_id', 3)->value('email') ?? \App\Models\Setting::value('company_email') ?? 'hr@email.com',
        ]);
    }

    public function index()
    {
        if (!in_array(auth()->user()->role_id, [1, 2])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return User::with('role')->orderByDesc('id')->get();
    }

    public function store(Request $request)
    {
        $currentUserRole = auth()->user()->role_id;

        // 1. Authorization Check
        if ($currentUserRole == 1) {
            // SuperAdmin can create Admin (2), HR (3), Employee (4)
        } elseif ($currentUserRole == 2) {
            // Admin can ONLY create Employee (4)
            if ($request->role_id != 4) {
                 return response()->json(['message' => 'Admins can only create Employees.'], 403);
            }
        } else {
            // HR (3) and Employee (4) cannot create users
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // 2. Validation
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'role_id' => 'required|integer|in:2,3,4',
            'temp_password' => 'required|string|min:4',
        ]);

        // 3. Create User
        $user = new User();
        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->role_id = $validated['role_id'];
        $user->temp_password = $validated['temp_password'];
        $user->password = Hash::make($validated['temp_password']);
        $user->save();

        // 4. Auto-create Employee record if role is Employee (4)
        $employee = null;
        if ($user->role_id == 4) {
            try {
                // Check if Employee model exists and create it
                $employee = new Employee();
                $employee->user_id = $user->id;
                // Generate a simple code or use random
                $employee->employee_code = 'EMP-' . str_pad($user->id, 4, '0', STR_PAD_LEFT);
                $employee->joining_category = 'New Joinee'; // Default for quick adds
                $employee->save();
                
                // Assign Leave Policy
                $this->leavePolicyService->assignPolicyToEmployee($employee);
            } catch (\Exception $e) {
                // Ignore if fails, or log it. 
                // For now we proceed as the user is created.
            }
        }

        return response()->json([
            'message' => 'User created successfully',
            'user' => $user,
            'employee' => $employee
        ], 201);
    }

    public function update(Request $request, $id)
    {
        if (!in_array(auth()->user()->role_id, [1, 2])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name'   => 'sometimes|string|max:255',
            'email'  => 'sometimes|email|unique:users,email,' . $id,
            'role_id' => 'sometimes|exists:roles,id',
            'temp_password' => 'sometimes|string|min:4',
        ]);

        if (isset($validated['temp_password'])) {
            $validated['password'] = Hash::make($validated['temp_password']);
            $validated['temp_password'] = $validated['temp_password'];
        }

        $user->update($validated);

        return response()->json([
            'message' => 'User updated successfully',
            'user' => $user
        ]);
    }

    public function setTempPassword(Request $request, $id)
    {
        if (!in_array(auth()->user()->role_id, [1, 2])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'temp_password' => 'required|min:4'
        ]);

        $user = User::findOrFail($id);

        $user->temp_password = $request->temp_password;
        $user->password = Hash::make($request->temp_password);
        $user->save();

        return response()->json([
            'message' => 'Temporary password updated successfully',
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'temp_password' => $user->temp_password
            ]
        ]);
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'new_password' => 'required|min:6'
        ]);

        $user = User::find($request->user_id);

        $user->password = Hash::make($request->new_password);
        $user->temp_password = null;
        $user->save();

        return response()->json([
            'message' => 'Password changed successfully'
        ]);
    }

    public function destroy($id)
    {
       if (!in_array(auth()->user()->role_id, [1, 2])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        User::findOrFail($id)->delete();

        return response()->json(['message' => 'User deleted']);
    }
}