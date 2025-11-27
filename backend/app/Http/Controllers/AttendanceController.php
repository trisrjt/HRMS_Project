<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Attendance;
use App\Models\Employee;
use App\Services\NotificationService;

class AttendanceController extends Controller
{
    protected $notifications;

    public function __construct(NotificationService $notifications)
    {
        $this->notifications = $notifications;
    }
    // =====================================
    // GET /api/attendances
    // HR + Admin + SuperAdmin
    // =====================================
    public function index()
    {
        if (!in_array(auth()->user()->role_id, [1,2,3])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json(
            Attendance::with('employee.user:id,name,email')
                ->orderByDesc('date')
                ->get(),
            200
        );
    }

    // =====================================
    // POST /api/attendances
    // HR/Admin/SuperAdmin can mark attendance manually
    // =====================================
    public function store(Request $request)
    {
        if (!in_array(auth()->user()->role_id, [1,2,3])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'date'        => 'required|date',
            'check_in'    => 'required|date_format:H:i:s',
        ]);

        // Prevent duplicate entries
        $exists = Attendance::where('employee_id', $validated['employee_id'])
            ->where('date', $validated['date'])
            ->first();

        if ($exists) {
            return response()->json(['message' => 'Attendance already exists for this date'], 409);
        }

        $attendance = Attendance::create([
            'employee_id' => $validated['employee_id'],
            'date'        => $validated['date'],
            'check_in'    => $validated['check_in'],
            'status'      => 'Present',
        ]);

        return response()->json([
            'message' => 'Attendance marked successfully',
            'attendance' => $attendance
        ], 201);
    }

    // =====================================
    // GET /api/attendances/{id}
    // HR + Admin + SuperAdmin
    // =====================================
    public function show($id)
    {
        if (!in_array(auth()->user()->role_id, [1,2,3])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $attendance = Attendance::with('employee.user:id,name,email')->find($id);

        if (!$attendance) {
            return response()->json(['message' => 'Record not found'], 404);
        }

        return response()->json($attendance, 200);
    }

    // =====================================
    // UPDATE DISABLED (No one can update attendance)
    // =====================================
    public function update(Request $request, $id)
    {
        return response()->json([
            'message' => 'Attendance update is not allowed'
        ], 403);
    }

    // =====================================
    // EMPLOYEE CHECK-IN
    // =====================================
    public function employeeCheckIn()
    {
        $user = auth()->user();

        if ($user->role_id != 4) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $employee = $user->employee;

        $today = now()->toDateString();

        // Prevent duplicate check-in
        if (Attendance::where('employee_id', $employee->id)->where('date', $today)->exists()) {
            return response()->json(['message' => 'Already checked in today'], 409);
        }

        $attendance = Attendance::create([
            'employee_id' => $employee->id,
            'date'        => $today,
            'check_in'    => now()->format('H:i:s'),
            'status'      => 'Present',
        ]);

        // Notify HR
        $this->notifications->sendToRoles(
            [3],
            "Employee Checked In",
            "{$employee->user->name} checked in at {$attendance->check_in}",
            "attendance",
            "/hr/attendance"
        );

        return response()->json([
            'message' => 'Check-in successful',
            'attendance' => $attendance
        ], 201);
    }

    // =====================================
    // EMPLOYEE CHECK-OUT
    // =====================================
    public function employeeCheckOut()
    {
        $user = auth()->user();

        if ($user->role_id != 4) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $employee = $user->employee;

        $today = now()->toDateString();

        $attendance = Attendance::where('employee_id', $employee->id)
            ->where('date', $today)
            ->first();

        if (!$attendance) {
            return response()->json(['message' => 'Check-in missing'], 400);
        }

        $attendance->update([
            'check_out' => now()->format('H:i:s'),
        ]);

        // Notify HR
        $this->notifications->sendToRoles(
            [3],
            "Employee Checked Out",
            "{$employee->user->name} checked out at {$attendance->check_out}",
            'attendance',
            "/hr/attendance"
        );

        return response()->json([
            'message' => 'Check-out successful',
            'attendance' => $attendance
        ]);
    }

    // =====================================
    // EMPLOYEE: VIEW OWN ATTENDANCE
    // =====================================
    public function myAttendance()
    {
        $user = auth()->user();

        if ($user->role_id != 4) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $employee = $user->employee;

        $records = Attendance::where('employee_id', $employee->id)
            ->orderByDesc('date')
            ->get();

        return response()->json($records, 200);
    }
}