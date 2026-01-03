<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class PermissionController extends Controller
{
    public function update(Request $request, $id)
    {
        // Enforce SuperAdmin only (though route middleware handles this too)
        if ($request->user()->role_id !== 1) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $user = \App\Models\User::findOrFail($id);

        // Validate payload
        $validated = $request->validate([
            'can_manage_employees' => 'boolean',
            'can_view_employees' => 'boolean',
            'can_manage_salaries' => 'boolean',
            'can_view_salaries' => 'boolean',
            'can_manage_attendance' => 'boolean',
            'can_view_attendance' => 'boolean',
            'can_manage_leaves' => 'boolean',
            'can_view_leaves' => 'boolean',
            'can_manage_departments' => 'boolean',
            'can_manage_payslips' => 'boolean',
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'Permissions updated successfully',
            'user' => $user
        ]);
    }
}
