<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Department;
use App\Services\NotificationService;

class DepartmentController extends Controller
{
    protected $notifications;

    public function __construct(NotificationService $notifications)
    {
        $this->notifications = $notifications;
    }
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

        // Notify Admins
        $this->notifications->sendToRoles(
            [2],
            "New Department Created",
            "Department {$department->name} has been added.",
            "admin-action",
            "/admin/departments"
        );

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