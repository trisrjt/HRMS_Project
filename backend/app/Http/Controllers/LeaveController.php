<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Leave;

class LeaveController extends Controller
{
    // ======================================
    // GET ALL LEAVES (HR, Admin, SuperAdmin)
    // Employee cannot see everyone's leaves
    // ======================================
    public function index()
    {
        $user = auth()->user();

        if (!in_array($user->role_id, [1,2,3])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json(
            Leave::with(['employee.user:id,name,email', 'leaveType', 'approver'])
                ->orderByDesc('id')
                ->get()
        );
    }

    // ======================================
    // EMPLOYEE APPLY LEAVE (role 4)
    // ======================================
    public function store(Request $request)
    {
        $user = auth()->user();

        // Only Employee can apply leave
        if ($user->role_id != 4) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'leave_type_id' => 'required|exists:leave_types,id',
            'start_date'    => 'required|date',
            'end_date'      => 'required|date|after_or_equal:start_date',
            'reason'        => 'nullable|string',
        ]);

        // Get employee profile
        $employee = $user->employee;

        if (!$employee) {
            return response()->json(['message' => 'Employee profile not found'], 404);
        }

        $leave = Leave::create([
            'employee_id'   => $employee->id,
            'leave_type_id' => $request->leave_type_id,
            'start_date'    => $request->start_date,
            'end_date'      => $request->end_date,
            'reason'        => $request->reason,
            'status'        => 'Pending',
            'approved_by'   => null,
        ]);

        return response()->json([
            'message' => 'Leave request submitted successfully',
            'leave'   => $leave
        ], 201);
    }

    // ======================================
    // VIEW SINGLE LEAVE
    // Employee → own leave only
    // HR/Admin → any leave
    // ======================================
    public function show($id)
    {
        $user = auth()->user();
        $leave = Leave::with(['employee.user', 'leaveType', 'approver'])->find($id);

        if (!$leave) {
            return response()->json(['message' => 'Leave not found'], 404);
        }

        // Employee can ONLY view their own leave
        if ($user->role_id == 4 && $leave->employee->user_id != $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($leave);
    }

    // ======================================
    // APPROVE / REJECT LEAVE
    // Only HR (3), Admin (2), SuperAdmin (1)
    // Employee cannot approve
    // ======================================
    public function update(Request $request, $id)
    {
        $user = auth()->user();

        if (!in_array($user->role_id, [1,2,3])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'status' => 'required|in:Approved,Rejected',
        ]);

        $leave = Leave::findOrFail($id);

        // Set approver automatically
        $leave->update([
            'status'      => $request->status,
            'approved_by' => $user->id,
        ]);

        return response()->json([
            'message' => "Leave {$request->status} successfully",
            'leave'   => $leave->load(['employee.user', 'leaveType', 'approver'])
        ]);
    }

    // ======================================
    // DELETE LEAVE
    // Only Admin (2) and SuperAdmin (1)
    // ======================================
    public function destroy($id)
    {
        $user = auth()->user();

        if (!in_array($user->role_id, [1,2])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $leave = Leave::find($id);

        if (!$leave) {
            return response()->json(['message' => 'Leave not found'], 404);
        }

        $leave->delete();

        return response()->json(['message' => 'Leave deleted successfully']);
    }
}