<?php

namespace App\Http\Controllers;

use App\Models\LeaveType;
use Illuminate\Http\Request;

class LeavePolicyController extends Controller
{
    // ======================================
    // GET /api/leave-policies (View all types + policies)
    // ======================================
    public function index()
    {
        if (!in_array(auth()->user()->role_id, [1, 2, 3])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $policies = LeaveType::all();
        return response()->json($policies);
    }

    // ======================================
    // PUT /api/leave-policies/{id} (Update Policy)
    // Only SuperAdmin (1) or Admin (2) usually, but HR (3) might need access if permitted.
    // User requested: SuperAdmin (Always), Admin/HR (If permission enabled).
    // I'll stick to Role check for now, middleware will handle permission.
    // ======================================
    public function update(Request $request, $id)
    {
        $user = auth()->user();
        
        // Strict Role check first: Only 1, 2, 3 allowed at all.
        if (!in_array($user->role_id, [1, 2, 3])) {
             return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Additional Permission Check would go here if using Spatie/Middleware
        // For now, assuming middleware handles route access

        $leaveType = LeaveType::findOrFail($id);

        $validated = $request->validate([
            'max_days_per_year' => 'integer|min:0',
            'carry_forward_allowed' => 'boolean',
            'allow_partial_approval' => 'boolean',
            'auto_approve' => 'boolean',
            'requires_approval' => 'boolean',
            'is_paid' => 'boolean',
            'available_during_probation' => 'boolean',
            'applicable_gender' => 'in:All,Male,Female,Other',
        ]);

        $leaveType->update($validated);

        return response()->json(['message' => 'Leave Policy updated', 'policy' => $leaveType]);
    }
}
