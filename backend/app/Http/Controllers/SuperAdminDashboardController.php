<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Employee;
use App\Models\Department;
use App\Models\Attendance;
use App\Models\Leave;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SuperAdminDashboardController extends Controller
{
    public function stats()
    {
        $today = Carbon::today();

        return response()->json([
            'total_users' => User::count(),
            'total_employees' => Employee::count(),
            'total_departments' => Department::count(),
            'total_admins_and_hr' => User::whereIn('role_id', [2, 3])->count(),
            'present_today' => Attendance::whereDate('date', $today)->where('status', 'Present')->count(),
            'on_leave_today' => Leave::whereDate('start_date', '<=', $today)
                                     ->whereDate('end_date', '>=', $today)
                                     ->where('status', 'Approved')
                                     ->count(),
            'pending_leave_requests' => Leave::where('status', 'Pending')->count(),
            'late_checkins' => Attendance::whereDate('date', $today)
                                         ->whereTime('check_in', '>', '09:30:00') // Assuming 9:30 AM is late
                                         ->count(),
        ]);
    }

    public function activityLog()
    {
        // Fetch recent activities from different tables
        $activities = collect();

        // 1. Recent Check-ins
        $attendances = Attendance::with('employee.user')
            ->whereDate('date', Carbon::today())
            ->latest('updated_at')
            ->take(5)
            ->get()
            ->map(function ($attendance) {
                return [
                    'message' => ($attendance->employee->user->name ?? 'Employee') . ' checked in.',
                    'timestamp' => Carbon::parse($attendance->check_in)->format('h:i A'),
                    'type' => 'info',
                    'created_at' => $attendance->updated_at
                ];
            });

        // 2. New Users
        $users = User::latest()
            ->take(5)
            ->get()
            ->map(function ($user) {
                return [
                    'message' => 'New user registered: ' . $user->name,
                    'timestamp' => $user->created_at->format('h:i A'),
                    'type' => 'success',
                    'created_at' => $user->created_at
                ];
            });

        // 3. Recent Leaves
        $leaves = Leave::with('employee.user')
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($leave) {
                $status = $leave->status;
                $type = $status === 'Approved' ? 'success' : ($status === 'Rejected' ? 'error' : 'warning');
                return [
                    'message' => 'Leave request ' . strtolower($status) . ' for ' . ($leave->employee->user->name ?? 'Employee'),
                    'timestamp' => $leave->updated_at->format('h:i A'),
                    'type' => $type,
                    'created_at' => $leave->updated_at
                ];
            });

        // Merge and sort
        $activities = $activities->concat($attendances)->concat($users)->concat($leaves)
            ->sortByDesc('created_at')
            ->take(10)
            ->values();

        return response()->json($activities);
    }

    public function systemHealth()
    {
        // Check DB connection
        try {
            DB::connection()->getPdo();
            $dbStatus = 'connected';
        } catch (\Exception $e) {
            $dbStatus = 'disconnected';
        }

        return response()->json([
            'api_status' => 'online',
            'database_status' => $dbStatus,
            'storage_status' => 'healthy', // Mocked for now
            'uptime' => 'Running', // PHP doesn't easily give uptime without shell_exec
            'queue_status' => 'running' // Mocked
        ]);
    }
}
