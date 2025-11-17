<?php

namespace App\Http\Controllers;

use App\Models\Recruitment;
use Illuminate\Http\Request;

class RecruitmentController extends Controller
{
    public function index()
    {
        return response()->json(Recruitment::with('department')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'department_id' => 'nullable|exists:departments,id',
            'description' => 'nullable|string',
            'status' => 'nullable|string'
        ]);

        $recruitment = Recruitment::create($data);
        return response()->json(['message' => 'Job posted successfully', 'data' => $recruitment], 201);
    }

    public function show($id)
    {
        return response()->json(Recruitment::with('department', 'candidates')->findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $recruitment = Recruitment::findOrFail($id);
        $recruitment->update($request->all());
        return response()->json(['message' => 'Job updated', 'data' => $recruitment]);
    }

    public function destroy($id)
    {
        Recruitment::findOrFail($id)->delete();
        return response()->json(['message' => 'Job deleted']);
    }
}