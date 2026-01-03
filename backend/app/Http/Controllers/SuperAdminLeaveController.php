<?php

namespace App\Http\Controllers;

use App\Models\Leave;
use App\Models\Employee;
use App\Models\LeaveBalance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Services\NotificationService;

class SuperAdminLeaveController extends Controller
{
    protected $notifications;

    public function __construct(NotificationService $notifications)
    {
        $this->notifications = $notifications;
    }

    // GET /api/superadmin/leaves
    public function index(Request $request)
    {
        $query = Leave::with([
            'employee' => function ($q) {
                $q->with('user', 'department')
                  ->withCount(['leaves as approved_leaves_count' => function ($query) {
                      $query->whereIn('status', ['Approved', 'Partially Approved']);
                  }])
                  ->addSelect(['total_approved_days' => Leave::selectRaw("SUM(
                        CASE 
                            WHEN status = 'Approved' THEN DATEDIFF(end_date, start_date) + 1
                            WHEN status = 'Partially Approved' THEN approved_days
                            ELSE 0 
                        END
                    )")
                    ->whereColumn('employee_id', 'employees.id')
                    ->whereIn('status', ['Approved', 'Partially Approved'])
                  ]);
            },
            'leaveType'
        ]);

        // Filter by Employee
        if ($request->has('employee_id') && $request->employee_id) {
            $query->where('employee_id', $request->employee_id);
        }

        // Filter by Department
        if ($request->has('department_id') && $request->department_id) {
            $query->whereHas('employee', function ($q) use ($request) {
                $q->where('department_id', $request->department_id);
            });
        }

        // Filter by Status
        if ($request->has('status') && $request->status && $request->status !== 'All') {
            $query->where('status', $request->status);
        }

        // Filter by Month (YYYY-MM)
        if ($request->has('month') && $request->month) {
            $query->where('start_date', 'like', "{$request->month}%");
        }
        
        // Search by Employee Name/Code/Email
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

        $perPage = $request->input('per_page', 20);
        $leaves = $query->orderByDesc('created_at')->paginate($perPage);

        return response()->json($leaves);
    }

    // GET /api/superadmin/leaves/summary
    public function summary(Request $request)
    {
        $query = Leave::query();

        if ($request->has('month') && $request->month) {
            $query->where('start_date', 'like', "{$request->month}%");
        }

        $total = (clone $query)->where('status', '!=', 'Withdrawn')->count();
        $pending = (clone $query)->where('status', 'Pending')->count();
        $approved = (clone $query)
            ->whereIn('status', ['Approved', 'Partially Approved'])
            ->selectRaw("SUM(
                CASE 
                    WHEN status = 'Approved' THEN DATEDIFF(end_date, start_date) + 1
                    WHEN status = 'Partially Approved' THEN approved_days
                    ELSE 0 
                END
            ) as total_days")
            ->value('total_days') ?? 0;

        $rejected = (clone $query)->where('status', 'Rejected')->count();

        return response()->json([
            'total' => $total,
            'pending' => $pending,
            'approved' => $approved,
            'rejected' => $rejected
        ]);
    }

    // POST /api/superadmin/leaves/{id}/approve
    public function approve($id)
    {
        $leave = Leave::findOrFail($id);
        
        if ($leave->status !== 'Pending') {
            return response()->json(['message' => 'Leave is already processed'], 400);
        }

        $leave->update([
            'status' => 'Approved',
            'approved_by' => auth()->id()
        ]);

        // Notify Employee
        $this->notifications->sendToUser(
            $leave->employee->user_id,
            "Leave Approved",
            "Your leave request for {$leave->start_date} has been approved.",
            "leave",
            "/employee/leaves"
        );

        return response()->json(['message' => 'Leave approved successfully']);
    }

    // POST /api/superadmin/leaves/{id}/reject
    public function reject($id)
    {
        $leave = Leave::findOrFail($id);

        if ($leave->status !== 'Pending') {
            return response()->json(['message' => 'Leave is already processed'], 400);
        }

        $leave->update([
            'status' => 'Rejected',
            'approved_by' => auth()->id()
        ]);

        // Restore Balance
        $days = (strtotime($leave->end_date) - strtotime($leave->start_date)) / (60 * 60 * 24) + 1;
        $balance = LeaveBalance::where('employee_id', $leave->employee_id)
            ->where('leave_type_id', $leave->leave_type_id)
            ->first();
        
        if ($balance) {
            $balance->decrement('used_days', $days);
        }

        // Notify Employee
        $this->notifications->sendToUser(
            $leave->employee->user_id,
            "Leave Rejected",
            "Your leave request for {$leave->start_date} has been rejected.",
            "leave",
            "/employee/leaves"
        );

        return response()->json(['message' => 'Leave rejected successfully']);
    }

    // GET /api/superadmin/leaves/export
    public function export(Request $request)
    {
        $query = Leave::with(['employee.user', 'employee.department', 'leaveType']);

        if ($request->has('month') && $request->month) {
            $query->where('start_date', 'like', "{$request->month}%");
        }
        if ($request->has('status') && $request->status && $request->status !== 'All') {
            $query->where('status', $request->status);
        }
        if ($request->has('department_id') && $request->department_id) {
            $query->whereHas('employee', function ($q) use ($request) {
                $q->where('department_id', $request->department_id);
            });
        }

        $leaves = $query->orderBy('start_date', 'desc')->get();

        $csvFileName = "leaves_export_" . date('Y-m-d') . ".csv";
        $headers = [
            "Content-type" => "text/csv",
            "Content-Disposition" => "attachment; filename=$csvFileName",
            "Pragma" => "no-cache",
            "Cache-Control" => "must-revalidate, post-check=0, pre-check=0",
            "Expires" => "0"
        ];

        $callback = function() use ($leaves) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Employee', 'Department', 'Type', 'Start Date', 'End Date', 'Reason', 'Status']);

            foreach ($leaves as $leave) {
                fputcsv($file, [
                    $leave->employee->user->name,
                    $leave->employee->department->name,
                    $leave->leaveType->name,
                    $leave->start_date,
                    $leave->end_date,
                    $leave->reason,
                    $leave->status
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
