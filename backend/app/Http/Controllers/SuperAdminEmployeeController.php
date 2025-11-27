<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class SuperAdminEmployeeController extends Controller
{
    // GET /api/superadmin/employees
    public function index(Request $request)
    {
        $query = Employee::with(['user', 'department']);

        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            })->orWhere('employee_code', 'like', "%{$search}%");
        }

        if ($request->has('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        $employees = $query->get();
        return response()->json($employees);
    }

    // POST /api/superadmin/employees
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'department_id' => 'required|exists:departments,id',
            'designation' => 'required|string|max:255',
            'date_of_joining' => 'required|date',
            'salary' => 'required|numeric',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
        ]);

        DB::beginTransaction();
        try {
            // Create User
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make('password123'), // Default password
                'role_id' => 4, // Employee role
                'is_active' => true,
            ]);

            // Create Employee Profile
            $employee = Employee::create([
                'user_id' => $user->id,
                'employee_code' => 'EMP' . str_pad($user->id, 3, '0', STR_PAD_LEFT),
                'department_id' => $validated['department_id'],
                'designation' => $validated['designation'],
                'date_of_joining' => $validated['date_of_joining'],
                'salary' => $validated['salary'],
                'phone' => $validated['phone'] ?? null,
                'address' => $validated['address'] ?? null,
            ]);

            DB::commit();
            return response()->json($employee->load('user', 'department'), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to create employee', 'error' => $e->getMessage()], 500);
        }
    }

    // PUT /api/superadmin/employees/{id}
    public function update(Request $request, $id)
    {
        $employee = Employee::findOrFail($id);
        $user = $employee->user;

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'department_id' => 'required|exists:departments,id',
            'designation' => 'required|string|max:255',
            'date_of_joining' => 'required|date',
            'salary' => 'required|numeric',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'status' => 'required|in:Active,Inactive',
        ]);

        DB::beginTransaction();
        try {
            // Update User
            $user->update([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'is_active' => $validated['status'] === 'Active',
            ]);

            // Update Employee Profile
            $employee->update([
                'department_id' => $validated['department_id'],
                'designation' => $validated['designation'],
                'date_of_joining' => $validated['date_of_joining'],
                'salary' => $validated['salary'],
                'phone' => $validated['phone'] ?? null,
                'address' => $validated['address'] ?? null,
            ]);

            DB::commit();
            return response()->json($employee->load('user', 'department'));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to update employee', 'error' => $e->getMessage()], 500);
        }
    }

    // DELETE /api/superadmin/employees/{id}
    public function destroy($id)
    {
        $employee = Employee::findOrFail($id);
        $user = $employee->user;

        DB::beginTransaction();
        try {
            $employee->delete();
            $user->delete();
            DB::commit();
            return response()->json(['message' => 'Employee deleted successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to delete employee', 'error' => $e->getMessage()], 500);
        }
    }
}
