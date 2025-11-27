<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use Illuminate\Http\Request;

class SuperAdminAttendanceController extends Controller
{
    // GET /api/superadmin/attendance
    public function index(Request $request)
    {
        // Ensure only SuperAdmin (role_id = 1) can access
        if (auth()->user()->role_id !== 1) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = Attendance::with(['employee.user', 'employee.department']);

        // Filter by Search (Employee Name, Email, Code)
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->whereHas('employee', function ($q) use ($search) {
                $q->where('employee_code', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($u) use ($search) {
                      $u->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        // Filter by Department
        if ($request->has('department_id') && $request->department_id) {
            $query->whereHas('employee', function ($q) use ($request) {
                $q->where('department_id', $request->department_id);
            });
        }

        // Filter by Status
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        // Filter by Date Range
        if ($request->has('start_date') && $request->start_date) {
            $query->whereDate('date', '>=', $request->start_date);
        }
        if ($request->has('end_date') && $request->end_date) {
            $query->whereDate('date', '<=', $request->end_date);
        }

        // Pagination
        $attendance = $query->orderByDesc('date')->paginate(10);

        return response()->json([
            'attendance' => $attendance
        ]);
    }
}
