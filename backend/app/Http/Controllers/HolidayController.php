<?php

namespace App\Http\Controllers;

use App\Models\Holiday;
use Illuminate\Http\Request;

class HolidayController extends Controller
{
    // ======================================
    // GET /api/holidays
    // ======================================
    public function index(Request $request)
    {
        // Allow all authenticated users to see holidays? 
        // Yes, employees need to see calendar.
        
        $query = Holiday::orderBy('start_date');

        if ($request->has('year')) {
            $query->whereYear('start_date', $request->year);
        }

        if ($request->has('month')) {
            $query->whereMonth('start_date', $request->month);
        }

        // Scope filtering?
        // Default show Global + User's Department + User's Location (location logic pending)
        // Admin sees ALL or filters by type.
        
        return response()->json($query->get());
    }

    // ======================================
    // POST /api/holidays (Admin/HR only)
    // ======================================
    public function store(Request $request)
    {
        if (!in_array(auth()->user()->role_id, [1, 2, 3])) { // SuperAdmin, Admin, HR
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'type' => 'required|in:Global,Department,Location',
            'department_id' => 'required_if:type,Department|nullable|exists:departments,id',
            'location' => 'required_if:type,Location|nullable|string',
        ]);

        $holiday = Holiday::create($validated);

        return response()->json(['message' => 'Holiday created successfully', 'holiday' => $holiday], 201);
    }

    // ======================================
    // PUT /api/holidays/{id}
    // ======================================
    public function update(Request $request, $id)
    {
        if (!in_array(auth()->user()->role_id, [1, 2, 3])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $holiday = Holiday::findOrFail($id);

        $validated = $request->validate([
            'name' => 'string',
            'start_date' => 'date',
            'end_date' => 'date|after_or_equal:start_date',
            'type' => 'in:Global,Department,Location',
            'department_id' => 'required_if:type,Department|nullable|exists:departments,id',
            'location' => 'required_if:type,Location|nullable|string',
        ]);

        $holiday->update($validated);

        return response()->json(['message' => 'Holiday updated successfully', 'holiday' => $holiday]);
    }

    // ======================================
    // DELETE /api/holidays/{id}
    // ======================================
    public function destroy($id)
    {
        if (!in_array(auth()->user()->role_id, [1, 2, 3])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $holiday = Holiday::findOrFail($id);
        $holiday->delete();

        return response()->json(['message' => 'Holiday deleted successfully']);
    }
}
