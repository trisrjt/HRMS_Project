<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Department;

class DepartmentController extends Controller
{
    // Get all departments
    public function index()
    {
        return response()->json(Department::all());
    }

    // Create a new department
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|unique:departments',
            'description' => 'nullable|string',
        ]);

        $department = Department::create($request->all());

        return response()->json([
            'message' => 'Department created successfully!',
            'data' => $department
        ], 201);
    }

    // Show single department
    public function show($id)
    {
        $department = Department::find($id);

        if (!$department) {
            return response()->json(['message' => 'Department not found'], 404);
        }

        return response()->json($department);
    }

    // Update department
    public function update(Request $request, $id)
    {
        $department = Department::find($id);

        if (!$department) {
            return response()->json(['message' => 'Department not found'], 404);
        }

        $department->update($request->all());

        return response()->json([
            'message' => 'Department updated successfully!',
            'data' => $department
        ]);
    }

    // Delete department
    public function destroy($id)
    {
        $department = Department::find($id);

        if (!$department) {
            return response()->json(['message' => 'Department not found'], 404);
        }

        $department->delete();

        return response()->json(['message' => 'Department deleted successfully!']);
    }
}