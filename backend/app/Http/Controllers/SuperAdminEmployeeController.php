<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\User;
use App\Models\Salary;
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
            // Generate password based on name (FirstName@123)
            $firstName = explode(' ', trim($validated['name']))[0];
            $plainPassword = ucfirst($firstName) . '@123';

            // Create User
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($plainPassword),
                'temp_password' => $plainPassword,
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

            // Create Default Salary Record
            Salary::create([
                'employee_id' => $employee->id,
                'basic' => 0,
                'hra' => 0,
                'da' => 0,
                'deductions' => 0,
                'gross_salary' => 0,
            ]);

            DB::commit();
            
            // Return employee data with plain password for admin to see
            $response = $employee->load('user', 'department')->toArray();
            $response['plain_password'] = $plainPassword;
            
            return response()->json($response, 201);
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

    // GET /api/superadmin/employees/{id}
    public function show($id)
    {
        $employee = Employee::with(['user', 'department'])->findOrFail($id);
        return response()->json($employee);
    }

    // GET /api/superadmin/employees/{id}/attendance
    public function attendance(Request $request, $id)
    {
        $employee = Employee::findOrFail($id);
        
        $query = \App\Models\Attendance::where('employee_id', $employee->id);

        if ($request->has('month')) {
            $month = $request->month; // YYYY-MM
            $query->where('date', 'like', "$month%");
        }

        if ($request->has('year')) {
            $query->whereYear('date', $request->year);
        }

        $attendance = $query->orderByDesc('date')->paginate(15);

        return response()->json($attendance);
    }

    // GET /api/superadmin/employees/{id}/attendance/summary
    public function attendanceSummary(Request $request, $id)
    {
        $employee = Employee::findOrFail($id);
        $query = \App\Models\Attendance::where('employee_id', $employee->id);

        if ($request->has('month')) {
            $month = $request->month; // YYYY-MM
            $query->where('date', 'like', "$month%");
        }

        $stats = [
            'present' => (clone $query)->where('status', 'Present')->count(),
            'absent' => (clone $query)->where('status', 'Absent')->count(),
            'late' => (clone $query)->where('status', 'Late')->count(),
            'on_leave' => (clone $query)->where('status', 'On Leave')->count(),
        ];

        return response()->json($stats);
    }

    // GET /api/superadmin/employees/{id}/attendance/export
    public function attendanceExport(Request $request, $id)
    {
        $employee = Employee::with('user')->findOrFail($id);
        $query = \App\Models\Attendance::where('employee_id', $employee->id);

        if ($request->has('month')) {
            $month = $request->month; // YYYY-MM
            $query->where('date', 'like', "$month%");
        }

        $attendance = $query->orderBy('date', 'asc')->get();

        $csvFileName = "attendance_{$employee->employee_code}_{$request->month}.csv";
        $headers = [
            "Content-type" => "text/csv",
            "Content-Disposition" => "attachment; filename=$csvFileName",
            "Pragma" => "no-cache",
            "Cache-Control" => "must-revalidate, post-check=0, pre-check=0",
            "Expires" => "0"
        ];

        $callback = function() use ($attendance, $employee) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Employee Code', 'Name', 'Date', 'Check In', 'Check Out', 'Status']);

            foreach ($attendance as $row) {
                fputcsv($file, [
                    $employee->employee_code,
                    $employee->user->name,
                    $row->date,
                    $row->check_in,
                    $row->check_out,
                    $row->status
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
