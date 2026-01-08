<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Leave;
use App\Models\LeaveBalance;
use App\Services\NotificationService;
use App\Services\HolidayService;
use App\Services\LeavePolicyService;

class LeaveController extends Controller
{
    protected $notifications;
    protected $holidayService;
    protected $leavePolicyService;

    public function __construct(NotificationService $notifications, HolidayService $holidayService, LeavePolicyService $leavePolicyService)
    {
        $this->notifications = $notifications;
        $this->holidayService = $holidayService;
        $this->leavePolicyService = $leavePolicyService;
    }
    // ======================================
    // GET ALL LEAVES (HR, Admin, SuperAdmin)
    // Employee cannot see everyone's leaves
    // ======================================
    // ======================================
    // GET ALL LEAVES (HR, Admin, SuperAdmin)
    // ======================================
    public function index(Request $request)
    {
        $user = auth()->user();

        // Permission/Role Check
        // Permission/Role Check
        // Allow SuperAdmin (1) or anyone with view/manage permissions
        if ($user->role_id !== 1 && !$user->can_view_leaves && !$user->can_manage_leaves) {
             return response()->json(['message' => 'Unauthorized'], 403);
        }

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
            'leaveType',
            'approver'
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

    // ======================================
    // LEAVE SUMMARY (For Dashboard/Stats)
    // ======================================
    public function summary(Request $request)
    {
        $user = auth()->user();
        if ($user->role_id !== 1 && !$user->can_view_leaves && !$user->can_manage_leaves) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

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

    // ======================================
    // EXPORT LEAVES
    // ======================================
    public function export(Request $request)
    {
        $user = auth()->user();
        if ($user->role_id !== 1 && !$user->can_view_leaves && !$user->can_manage_leaves) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

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

        $employee = $user->employee;
        if (!$employee) {
            return response()->json(['message' => 'Employee profile not found'], 404);
        }

        $leaveType = \App\Models\LeaveType::findOrFail($request->leave_type_id);
        
        // 0. Gender Check
        if ($leaveType->applicable_gender !== 'All') {
            if (strcasecmp($employee->gender, $leaveType->applicable_gender) !== 0) {
                 return response()->json(['message' => "This leave type is only applicable for {$leaveType->applicable_gender} employees"], 400);
            }
        }

        // 1. Policy: Probation Check
        if (!$leaveType->available_during_probation) {
            $probationMonths = (int) ($employee->probation_months ?? 0);
            if ($probationMonths > 0) {
                 $joinDate = \Carbon\Carbon::parse($employee->date_of_joining);
                 $probationEnd = $joinDate->copy()->addMonths($probationMonths);
                 
                 // Check if the leave start date falls within probation
                 if (\Carbon\Carbon::parse($request->start_date)->lt($probationEnd)) {
                      return response()->json(['message' => 'This leave type is not available during probation period. Probation ends on: ' . $probationEnd->format('d M Y')], 400);
                 }
            }
        }

        // 2. Calculate Working Days (Excluding Holidays/Weekends)
        $calculation = $this->holidayService->calculateLeaveDays($request->start_date, $request->end_date, $employee);
        $days = $calculation['days'];

        if ($days <= 0) {
             return response()->json(['message' => 'Selected range contains only holidays or weekends'], 400);
        }

        // 3. Check Balance
        $balance = LeaveBalance::firstOrCreate(
            ['employee_id' => $employee->id, 'leave_type_id' => $request->leave_type_id],
            ['allocated_days' => 0, 'used_days' => 0]
        );

        if ($balance->remaining_days < $days) {
            return response()->json(['message' => 'Insufficient leave balance. Available: ' . $balance->remaining_days . ' days, Requested: ' . $days . ' days'], 400);
        }

        // 4. Determine Status (Auto Approve DISABLED)
        $status = 'Pending';
        $approvedBy = null;

        // 5. Deduct Balance (Optimistic)
        $balance->increment('used_days', $days);

        $leave = Leave::create([
            'employee_id'   => $employee->id,
            'leave_type_id' => $request->leave_type_id,
            'start_date'    => $request->start_date,
            'end_date'      => $request->end_date,
            'days'          => $days, // Ensure Leave model has 'days' column? Wait, Leave model might not have 'days' column.
            'reason'        => $request->reason,
            'status'        => $status,
            'approved_by'   => $approvedBy,
        ]);

        // Notify Admins & HR & SuperAdmin (only if Pending?)
        if ($status === 'Pending') {
            $this->notifications->sendToRoles(
                [1, 2, 3],
                "New Leave Request",
                "{$employee->user->name} applied for {$leaveType->name} leave ({$days} days)",
                "leave",
                "/admin/leaves"
            );
        } else {
             // Notify Employee of Auto-Approval
             $this->notifications->sendToUser(
                $user->id,
                "Leave Approved",
                "Your leave request has been auto-approved.",
                "leave",
                "/employee/leaves"
            );
        }

        return response()->json([
            'message' => $status === 'Approved' ? 'Leave auto-approved successfully' : 'Leave request submitted successfully',
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

        // Permission check for HR/Admin
        if ($user->role_id !== 4 && $user->role_id !== 1 && !$user->can_view_leaves && !$user->can_manage_leaves) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

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

        // Restore Balance if Rejected
        if ($request->status === 'Rejected') {
            $days = (strtotime($leave->end_date) - strtotime($leave->start_date)) / (60 * 60 * 24) + 1;
            $balance = LeaveBalance::where('employee_id', $leave->employee_id)
                ->where('leave_type_id', $leave->leave_type_id)
                ->first();
            
            if ($balance) {
                $balance->decrement('used_days', $days);
            }
        }

        // Notify Employee
        $this->notifications->sendToUser(
            $leave->employee->user_id,
            "Leave {$request->status}",
            "Your leave request from {$leave->start_date} to {$leave->end_date} has been {$request->status}.",
            "leave",
            "/employee/leaves"
        );

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
    public function myLeaves()
{
    $user = auth()->user();

    if ($user->role_id != 4) {
        return response()->json(['message' => 'Unauthorized'], 403);
    }

    $employee = $user->employee;

    if (!$employee) {
        return response()->json(['message' => 'Employee profile not found'], 404);
    }

    return response()->json(
        Leave::with(['leaveType', 'approver:id,name,role_id'])
            ->where('employee_id', $employee->id)
            ->orderByDesc('start_date')
            ->get()
    );
}

    // ======================================
    // TEAM LEAVES (Manager View)
    // ======================================
    public function teamLeaves(Request $request)
    {
        $user = auth()->user();

        if ($user->role_id != 4) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $manager = $user->employee;
        if (!$manager) {
            return response()->json(['message' => 'Employee profile not found'], 404);
        }

        $subordinateIds = $manager->getAllSubordinateIds();

        if ($subordinateIds->isEmpty()) {
            return response()->json([]);
        }

        $query = Leave::with(['employee.user:id,name,email', 'leaveType', 'approver:id,name'])
            ->whereIn('employee_id', $subordinateIds)
            ->orderByDesc('created_at');

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        if ($request->has('employee_id') && $request->employee_id) {
            $query->where('employee_id', $request->employee_id);
        }

        return response()->json($query->paginate(15));
    }

    // ======================================
    // WITHDRAW LEAVE (Employee)
    // ======================================
    public function withdraw($id)
    {
        $user = auth()->user();

        if ($user->role_id != 4) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $leave = Leave::with('leaveType')->findOrFail($id);

        // Check ownership
        if ($leave->employee->user_id != $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Check status
        if (!in_array($leave->status, ['Pending', 'Submitted'])) {
            return response()->json(['message' => 'Cannot withdraw processed leave'], 400);
        }

        // Check start date (must be in future or today)
        if (strtotime($leave->start_date) < strtotime(date('Y-m-d'))) {
            return response()->json(['message' => 'Cannot withdraw leave that has already passed'], 400);
        }

        $leave->update([
            'status' => 'Withdrawn',
            'withdrawn_at' => now(),
        ]);

        // Restore Balance
        $days = (strtotime($leave->end_date) - strtotime($leave->start_date)) / (60 * 60 * 24) + 1;
        $balance = LeaveBalance::where('employee_id', $leave->employee_id)
            ->where('leave_type_id', $leave->leave_type_id)
            ->first();
        
        if ($balance) {
            $balance->decrement('used_days', $days);
        }

        // Notify Admin/HR/SuperAdmin
        $this->notifications->sendToRoles(
            [1, 2, 3],
            "Leave Withdrawn",
            "{$user->name} withdrew their leave request for {$leave->start_date}",
            "leave",
            "/admin/leaves"
        );

        return response()->json(['message' => 'Leave withdrawn successfully']);
    }

    // ======================================
    // PARTIAL APPROVE (Admin/SuperAdmin/HR)
    // ======================================
    public function partialApprove(Request $request, $id)
    {
        $user = auth()->user();

        if (!in_array($user->role_id, [1, 2, 3])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'approved_start_date' => 'required|date',
            'approved_end_date'   => 'required|date|after_or_equal:approved_start_date',
        ]);

        $leave = Leave::with(['employee.user', 'leaveType'])->findOrFail($id);

        if ($leave->status !== 'Pending') {
            return response()->json(['message' => 'Leave is already processed'], 400);
        }

        // Validate date range is within original request
        if ($request->approved_start_date < $leave->start_date || $request->approved_end_date > $leave->end_date) {
            return response()->json(['message' => 'Approved dates must be within the original requested range'], 400);
        }

        $approvedDays = (strtotime($request->approved_end_date) - strtotime($request->approved_start_date)) / (60 * 60 * 24) + 1;

        $leave->update([
            'status' => 'Partially Approved',
            'approved_start_date' => $request->approved_start_date,
            'approved_end_date'   => $request->approved_end_date,
            'approved_days'       => $approvedDays,
            'approved_by'         => $user->id,
        ]);

        // Restore Unused Balance
        // Original Request Days
        $originalDays = (strtotime($leave->end_date) - strtotime($leave->start_date)) / (60 * 60 * 24) + 1;
        $returnedDays = $originalDays - $approvedDays;

        if ($returnedDays > 0) {
            $balance = LeaveBalance::where('employee_id', $leave->employee_id)
                ->where('leave_type_id', $leave->leave_type_id)
                ->first();
            
            if ($balance) {
                $balance->decrement('used_days', $returnedDays);
            }
        }

        // Notify Employee
        $this->notifications->sendToUser(
            $leave->employee->user_id,
            "Leave Partially Approved",
            "Your leave has been partially approved for {$request->approved_start_date} to {$request->approved_end_date} ($approvedDays days).",
            "leave",
            "/employee/leaves"
        );

        return response()->json(['message' => 'Leave partially approved successfully']);
    }

    // ======================================
    // GET MY LEAVE BALANCES (Employee)
    // ======================================
    public function myBalances()
    {
        $user = auth()->user();

        if ($user->role_id != 4) {
             return response()->json(['message' => 'Unauthorized'], 403);
        }

        $employee = $user->employee;

        if (!$employee) {
             return response()->json(['message' => 'Employee profile not found'], 404);
        }

        $balances = LeaveBalance::with('leaveType')
            ->where('employee_id', $employee->id)
            ->get();
        
        // Self-Healing: Check for missing policy or category mismatch (e.g. Permanent employee with Probation policy)
        $employee->load('leavePolicy');
        $needsUpdate = false;

        // Case 1: No Policy assigned, but has category
        if (!$employee->leave_policy_id && $employee->joining_category) {
            $needsUpdate = true;
        }
        // Case 2: Policy assigned, but mismatch category
        elseif ($employee->leave_policy_id && $employee->leavePolicy && $employee->leavePolicy->joining_category !== $employee->joining_category) {
             $needsUpdate = true;
        }
        // Case 3: No balances (backup check)
        elseif ($balances->isEmpty() && $employee->joining_category) {
             $needsUpdate = true;
        }

        if ($needsUpdate) {
            $this->leavePolicyService->assignPolicyToEmployee($employee);
            
            // Refresh balances
            $balances = LeaveBalance::with('leaveType')
                ->where('employee_id', $employee->id)
                ->get();
        }
        
        return response()->json($balances);
    }

    // ======================================
    // GET APPLICABLE LEAVE TYPES (Employee)
    // ======================================
    public function getApplicableLeaveTypes()
    {
        $user = auth()->user();

        if ($user->role_id != 4) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $employee = $user->employee;

        if (!$employee) {
            return response()->json(['message' => 'Employee profile not found'], 404);
        }

        $types = \App\Models\LeaveType::all()->filter(function($type) use ($employee) {
             if ($type->applicable_gender === 'All') return true;
             // Null check for gender just in case
             if (!$employee->gender) return false; 
             return strcasecmp($type->applicable_gender, $employee->gender) === 0;
        })->values();

        return response()->json($types);
    }
}