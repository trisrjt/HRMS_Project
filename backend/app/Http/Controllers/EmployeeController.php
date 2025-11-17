<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EmployeeController extends Controller
{
    // GET /api/employees
    public function index()
    {
        return Employee::with(['department', 'role', 'user:id,name,email'])->orderByDesc('id')->get();
    }

    // POST /api/employees
    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id'       => ['required','exists:users,id','unique:employees,user_id'],
            'department_id' => ['nullable','exists:departments,id'],
            'role_id'       => ['nullable','exists:roles,id'],
            'employee_code' => ['required','string','max:50','unique:employees,employee_code'],
            'phone'         => ['nullable','string','max:20'],
            'address'       => ['nullable','string','max:255'],
            'date_of_joining'=> ['nullable','date'],
            'designation'   => ['nullable','string','max:100'],
            'salary'        => ['nullable','numeric','min:0'],
        ]);

        $emp = Employee::create($validated);

        return response()->json([
            'message' => 'Employee created',
            'employee' => $emp->load(['department','role','user:id,name,email'])
        ], 201);
    }

    // GET /api/employees/{id}
    public function show($id)
    {
        $emp = Employee::with(['department','role','user:id,name,email'])->findOrFail($id);
        return $emp;
    }

    // PUT /api/employees/{id}
    public function update(Request $request, $id)
    {
        $emp = Employee::findOrFail($id);

        $validated = $request->validate([
            'user_id'       => ['sometimes','exists:users,id', Rule::unique('employees','user_id')->ignore($emp->id)],
            'department_id' => ['sometimes','nullable','exists:departments,id'],
            'role_id'       => ['sometimes','nullable','exists:roles,id'],
            'employee_code' => ['sometimes','string','max:50', Rule::unique('employees','employee_code')->ignore($emp->id)],
            'phone'         => ['sometimes','nullable','string','max:20'],
            'address'       => ['sometimes','nullable','string','max:255'],
            'date_of_joining'=> ['sometimes','nullable','date'],
            'designation'   => ['sometimes','nullable','string','max:100'],
            'salary'        => ['sometimes','nullable','numeric','min:0'],
        ]);

        $emp->update($validated);

        return response()->json([
            'message' => 'Employee updated',
            'employee' => $emp->fresh()->load(['department','role','user:id,name,email'])
        ]);
    }

    // DELETE /api/employees/{id}
    public function destroy($id)
    {
        $emp = Employee::findOrFail($id);
        $emp->delete();

        return response()->json(['message' => 'Employee deleted']);
    }
}