<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Hash;   

class EmployeeController extends Controller
{
    // ==============================
    // GET /api/employees
    // ==============================
    public function index()
    {
        return Employee::with([
            'department',
            'role',
            'user:id,name,email'
        ])->orderByDesc('id')->get();
    }

    // ==============================
    // POST /api/employees
    // Only Admin (2) and Super Admin (1)
    // Creates employee profile for an existing user
    // ==============================
    public function store(Request $request)
{
    // Only Super Admin (1) and Admin (2) can create employees
    if (!in_array(auth()->user()->role_id, [1, 2])) {
        return response()->json(['message' => 'Unauthorized'], 403);
    }

    // Validate Employee creation input
    $validated = $request->validate([
        'name' => ['required', 'string'],
        'email' => ['required', 'email', 'unique:users,email'],
        'temp_password' => ['required', 'string', 'min:4'],

        'department_id' => ['nullable', 'exists:departments,id'],
        'phone' => ['nullable', 'string', 'max:20'],
        'address' => ['nullable', 'string', 'max:255'],
        'date_of_joining' => ['nullable', 'date'],
        'designation' => ['nullable', 'string', 'max:100'],
        'salary' => ['nullable', 'numeric', 'min:0'],
    ]);

    // AUTO-GENERATE EMPLOYEE CODE: EMP001, EMP002...
    $lastEmp = Employee::orderBy('id', 'desc')->first();
    $nextNumber = $lastEmp ? $lastEmp->id + 1 : 1;
    $employeeCode = 'EMP' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);

    // STEP 1: Create USER automatically
    $user = User::create([
        'name' => $validated['name'],
        'email' => $validated['email'],
        'role_id' => 4, // ALWAYS employee
        'password' => Hash::make($validated['temp_password']),
        'temp_password' => true,
    ]);

    // STEP 2: Create Employee entry
    $emp = Employee::create([
        'user_id' => $user->id,
        'department_id' => $validated['department_id'] ?? null,
        'employee_code' => $employeeCode,
        'phone' => $validated['phone'] ?? null,
        'address' => $validated['address'] ?? null,
        'date_of_joining' => $validated['date_of_joining'] ?? null,
        'designation' => $validated['designation'] ?? null,
        'salary' => $validated['salary'] ?? null,
    ]);

    return response()->json([
        'message' => 'Employee created successfully',
        'user' => $user,
        'employee' => $emp
    ], 201);
}


    // ==============================
    // GET /api/employees/{id}
    // ==============================
    public function show($id)
    {
        $employee = Employee::with(['department', 'role', 'user:id,name,email'])->findOrFail($id);
        return $employee;
    }

    // ==============================
    // PUT /api/employees/{id}
    // ==============================
    public function update(Request $request, $id)
    {
        $employee = Employee::findOrFail($id);

        $validated = $request->validate([
            'department_id'  => ['sometimes', 'nullable', 'exists:departments,id'],
            'employee_code'  => ['sometimes', 'string', 'max:50', Rule::unique('employees', 'employee_code')->ignore($employee->id)],
            'phone'          => ['sometimes', 'nullable', 'string', 'max:20'],
            'address'        => ['sometimes', 'nullable', 'string', 'max:255'],
            'date_of_joining'=> ['sometimes', 'nullable', 'date'],
            'designation'    => ['sometimes', 'nullable', 'string', 'max:100'],
            'salary'         => ['sometimes', 'nullable', 'numeric', 'min:0'],
        ]);

        $employee->update($validated);

        return response()->json([
            'message'  => 'Employee updated successfully.',
            'employee' => $employee->fresh()->load(['department', 'role', 'user:id,name,email'])
        ]);
    }

    // ==============================
    // DELETE /api/employees/{id}
    // ==============================
    public function destroy($id)
    {
        $employee = Employee::findOrFail($id);
        $employee->delete();

        return response()->json(['message' => 'Employee deleted']);
    }
}