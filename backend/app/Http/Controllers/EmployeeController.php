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
    // Only SuperAdmin (1) & Admin (2)
    if (!in_array(auth()->user()->role_id, [1, 2])) {
        return response()->json(['message' => 'Unauthorized'], 403);
    }

    // Validate incoming request
    $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|email|unique:users,email',
        'temp_password' => 'required|min:6',
        'department_id' => 'required|exists:departments,id',
        'designation' => 'required|string|max:255',
        'salary' => 'required|numeric',
        'phone' => 'nullable|string|max:20',
        'address' => 'nullable|string',
        'date_of_joining' => 'nullable|date',
    ]);

    // Step 1: Create USER
    $user = User::create([
        'name' => $request->name,
        'email' => $request->email,
        'password' => Hash::make($request->temp_password), // hashed
        'temp_password' => $request->temp_password,        // raw temp pass
        'role_id' => 4, // Employee
    ]);

    // Step 2: Generate employee code
    $employeeCode = 'EMP' . str_pad(Employee::count() + 1, 3, '0', STR_PAD_LEFT);

    // Step 3: Create EMPLOYEE
    $employee = Employee::create([
        'user_id' => $user->id,
        'department_id' => $request->department_id,
        'employee_code' => $employeeCode,
        'designation' => $request->designation,
        'salary' => $request->salary,
        'phone' => $request->phone,
        'address' => $request->address,
        'date_of_joining' => $request->date_of_joining,
    ]);

    // Step 4: Response
    return response()->json([
        'message' => 'Employee created successfully',
        'user' => $user,
        'employee' => $employee
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