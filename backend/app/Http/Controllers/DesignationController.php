<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Designation;

class DesignationController extends Controller
{
    public function index()
    {
        return response()->json(Designation::all());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|unique:designations',
            'description' => 'nullable|string',
        ]);

        $designation = Designation::create($request->all());

        return response()->json([
            'message' => 'Designation created successfully!',
            'data' => $designation
        ], 201);
    }

    public function show($id)
    {
        $designation = Designation::find($id);

        if (!$designation) {
            return response()->json(['message' => 'Designation not found'], 404);
        }

        return response()->json($designation);
    }

    public function update(Request $request, $id)
    {
        $designation = Designation::find($id);

        if (!$designation) {
            return response()->json(['message' => 'Designation not found'], 404);
        }

        $designation->update($request->all());

        return response()->json([
            'message' => 'Designation updated successfully!',
            'data' => $designation
        ]);
    }

    public function destroy($id)
    {
        $designation = Designation::find($id);

        if (!$designation) {
            return response()->json(['message' => 'Designation not found'], 404);
        }

        $designation->delete();

        return response()->json(['message' => 'Designation deleted successfully!']);
    }
}