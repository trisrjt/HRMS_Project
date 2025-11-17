<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Attendance;

class AttendanceController extends Controller
{
    // 🔹 List all attendance records
    public function index()
    {
        // Always return JSON
        return response()->json(Attendance::with('employee')->get(), 200);
    }

    // 🔹 Mark attendance (clock in)
    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'date' => 'required|date',
            'check_in' => 'required|date_format:H:i:s',
        ]);

        $attendance = Attendance::create([
            'employee_id' => $validated['employee_id'],
            'date' => $validated['date'],
            'check_in' => $validated['check_in'],
            'status' => 'Present',
        ]);

        return response()->json([
            'message' => 'Attendance marked successfully',
            'attendance' => $attendance
        ], 201);
    }

    // 🔹 Show single attendance record
    public function show($id)
    {
        $attendance = Attendance::with('employee')->find($id);

        if (!$attendance) {
            return response()->json(['message' => 'Record not found'], 404);
        }

        return response()->json($attendance, 200);
    }

    // 🔹 Update attendance (clock out)
    public function update(Request $request, $id)
    {
        $attendance = Attendance::find($id);

        if (!$attendance) {
            return response()->json(['message' => 'Record not found'], 404);
        }

        $attendance->update($request->only(['check_out', 'status']));
        return response()->json([
            'message' => 'Attendance updated successfully',
            'attendance' => $attendance
        ], 200);
    }
}