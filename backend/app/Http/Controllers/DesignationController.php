<?php

namespace App\Http\Controllers;

use App\Models\Designation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DesignationController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Return sorted by level (hierarchy)
        $designations = Designation::with(['creator:id,name', 'editor:id,name'])
            ->orderBy('name', 'asc') // Sorted by Name
            ->get();
            
        return response()->json($designations);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:designations,name',
            // 'level' => 'required|integer|min:1', // Removed
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $designation = Designation::create([
            'name' => $validated['name'],
            // 'level' => $validated['level'], // Removed
            'description' => $validated['description'],
            'is_active' => $validated['is_active'] ?? true,
            'created_by' => auth()->id(),
            'updated_by' => auth()->id(),
        ]);

        return response()->json($designation, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $designation = Designation::findOrFail($id);
        return response()->json($designation);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $designation = Designation::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|unique:designations,name,' . $id,
            // 'level' => 'required|integer|min:1', // Removed
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $designation->update([
            'name' => $validated['name'],
            // 'level' => $validated['level'], // Removed
            'description' => $validated['description'],
            'is_active' => $validated['is_active'] ?? $designation->is_active,
            'updated_by' => auth()->id(),
        ]);

        return response()->json($designation);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $designation = Designation::findOrFail($id);
        
        // Prevent deletion if assigned to employees
        if ($designation->employees()->exists()) {
            return response()->json([
                'message' => 'Cannot delete designation assigned to employees. Please reassign them first.'
            ], 422);
        }

        $designation->delete();

        return response()->json(['message' => 'Designation deleted successfully']);
    }

    public function toggleStatus($id)
    {
        $designation = Designation::find($id);
        if (!$designation) {
            return response()->json(['message' => 'Designation not found'], 404);
        }

        $designation->is_active = !$designation->is_active;
        $designation->save();

        return response()->json([
            'message' => 'Designation status updated successfully',
            'is_active' => $designation->is_active
        ]);
    }
}