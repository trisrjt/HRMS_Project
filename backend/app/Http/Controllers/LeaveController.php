<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Leave;

class LeaveController extends Controller
{
    /**
     * 🔹 Get all leave records (with employee & leave type details)
     */
    public function index()
    {
        return response()->json(
            Leave::with(['employee', 'leaveType', 'approver'])->get()
        );
    }

    /**
     * 🔹 Apply for a new leave request
     */
    public function store(Request $request)
    {
        $request->validate([
            'employee_id'   => 'required|exists:employees,id',
            'leave_type_id' => 'required|exists:leave_types,id',
            'start_date'    => 'required|date',
            'end_date'      => 'required|date|after_or_equal:start_date',
            'reason'        => 'nullable|string',
        ]);

        $leave = Leave::create([
            'employee_id'   => $request->employee_id,
            'leave_type_id' => $request->leave_type_id,
            'start_date'    => $request->start_date,
            'end_date'      => $request->end_date,
            'reason'        => $request->reason,
            'status'        => 'Pending',
        ]);

        return response()->json([
            'message' => 'Leave request submitted successfully',
            'leave'   => $leave
        ], 201);
    }

    /**
     * 🔹 Show details of a specific leave request
     */
    public function show($id)
    {
        $leave = Leave::with(['employee', 'leaveType', 'approver'])->find($id);

        if (!$leave) {
            return response()->json(['message' => 'Leave not found'], 404);
        }

        return response()->json($leave);
    }

    /**
     * 🔹 Approve or Reject a leave request
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'status'      => 'required|in:Approved,Rejected',
            'approved_by' => 'required|exists:users,id',
        ]);

        $leave = Leave::findOrFail($id);

        $leave->update([
            'status'      => $request->status,
            'approved_by' => $request->approved_by,
        ]);

        return response()->json([
            'message' => "Leave {$request->status} successfully",
            'leave'   => $leave
        ]);
    }

    /**
     * 🔹 Delete a leave request (optional)
     */
    public function destroy($id)
    {
        $leave = Leave::find($id);

        if (!$leave) {
            return response()->json(['message' => 'Leave not found'], 404);
        }

        $leave->delete();

        return response()->json(['message' => 'Leave deleted successfully']);
    }
}