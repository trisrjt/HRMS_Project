<?php

namespace App\Http\Controllers;

use App\Models\Department;
use Illuminate\Http\Request;

class SuperAdminDepartmentController extends Controller
{
    // GET /api/superadmin/departments
    public function index()
    {
        // Ensure only SuperAdmin (role_id = 1) can access
        if (auth()->user()->role_id !== 1) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $departments = Department::orderBy('name')->get();
        return response()->json($departments);
    }

    // POST /api/superadmin/departments
    public function store(Request $request)
    {
        if (auth()->user()->role_id !== 1) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255|unique:departments,name',
        ]);

        $department = Department::create([
            'name' => $request->name,
        ]);

        return response()->json([
            'message' => 'Department created successfully',
            'department' => $department
        ], 201);
    }

    // PUT /api/superadmin/departments/{id}
    public function update(Request $request, $id)
    {
        if (auth()->user()->role_id !== 1) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $department = Department::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255|unique:departments,name,' . $id,
        ]);

        $department->update([
            'name' => $request->name,
        ]);

        return response()->json([
            'message' => 'Department updated successfully',
            'department' => $department
        ]);
    }

    // DELETE /api/superadmin/departments/{id}
    public function destroy($id)
    {
        if (auth()->user()->role_id !== 1) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $department = Department::findOrFail($id);
        $department->delete();

        return response()->json(['message' => 'Department deleted successfully']);
    }
}
