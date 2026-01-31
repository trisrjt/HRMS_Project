<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\Attendance;
use App\Models\Employee;
use App\Services\NotificationService;
use App\Services\HolidayService; // Import
use Carbon\Carbon;

class AttendanceController extends Controller
{
    protected $notifications;
    protected $holidayService; // Add property

    public function __construct(NotificationService $notifications, HolidayService $holidayService)
    {
        $this->notifications = $notifications;
        $this->holidayService = $holidayService; // Inject
    }
    // =====================================
    // GET /api/attendances
    // HR + Admin + SuperAdmin
    // =====================================
    public function index(Request $request)
    {
        if (!in_array(auth()->user()->role_id, [1, 2, 3])) {
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

        // Filter by Date (Exact)
        if ($request->has('date') && $request->date) {
            $query->where('date', $request->date);
        }

        // Filter by Date Range
        if ($request->has('start_date') && $request->start_date) {
            $query->whereDate('date', '>=', $request->start_date);
        }
        if ($request->has('end_date') && $request->end_date) {
            $query->whereDate('date', '<=', $request->end_date);
        }

        return response()->json($query->orderByDesc('date')->paginate(15));
    }

    // =====================================
    // POST /api/attendances
    // HR/Admin/SuperAdmin can mark attendance manually
    // =====================================
    public function store(Request $request)
    {
        if (!in_array(auth()->user()->role_id, [1, 2, 3])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'date' => 'required|date',
            'check_in' => 'required|date_format:H:i:s',
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
            'date' => $validated['date'],
            'check_in' => $validated['check_in'],
            'status' => 'Present',
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
        if (!in_array(auth()->user()->role_id, [1, 2, 3])) {
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
    public function employeeCheckIn(Request $request)
    {
        $user = auth()->user();

        if (!$user) {
            return response()->json(['message' => 'User not authenticated'], 401);
        }

        if ($user->role_id != 4) {
            return response()->json([
                'message' => 'Unauthorized - Only employees can check in',
                'debug' => [
                    'user_id' => $user->id,
                    'role_id' => $user->role_id
                ]
            ], 403);
        }

        $employee = $user->employee;

        if (!$employee) {
            return response()->json(['message' => 'Employee profile not found'], 404);
        }

        $today = now()->toDateString();

        // Check if already checked in today
        $existingAttendance = Attendance::where('employee_id', $employee->id)
            ->where('date', $today)
            ->first();

        if ($existingAttendance) {
            return response()->json([
                'message' => 'Already checked in today',
                'attendance' => $existingAttendance
            ], 200); // Return 200 instead of 409 with existing record
        }

        // Validate location and device data
        $validated = $request->validate([
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'device_id' => 'nullable|string|max:255',
            'device_type' => 'nullable|string|max:255',
            'browser' => 'nullable|string|max:255',
        ]);

        try {
            $attendance = Attendance::create([
                'employee_id' => $employee->id,
                'date' => $today,
                'check_in' => now()->format('H:i:s'),
                'status' => 'Present',
                'check_in_latitude' => $validated['latitude'] ?? null,
                'check_in_longitude' => $validated['longitude'] ?? null,
                'device_id' => $validated['device_id'] ?? null,
                'device_type' => $validated['device_type'] ?? null,
                'browser' => $validated['browser'] ?? null,
                'ip_address' => $request->ip(),
                'checked_in_by' => 'self',
            ]);

            // Notify HR (don't let notification failure break check-in)
            try {
                $this->notifications->sendToRoles(
                    [3],
                    "Employee Checked In",
                    "{$employee->user->name} checked in at {$attendance->check_in}",
                    "attendance",
                    "/hr/attendance"
                );
            } catch (\Exception $e) {
                // Log but don't fail - notification is not critical
            }

            return response()->json([
                'message' => 'Check-in successful',
                'attendance' => $attendance->fresh()
            ], 201);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Check-in failed: " . $e->getMessage());
            \Illuminate\Support\Facades\Log::error($e);
            return response()->json([
                'message' => 'Failed to check in',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // =====================================
    // EMPLOYEE CHECK-OUT
    // =====================================
    public function employeeCheckOut(Request $request)
    {
        $user = auth()->user();

        if (!$user) {
            return response()->json(['message' => 'User not authenticated'], 401);
        }

        if ($user->role_id != 4) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $employee = $user->employee;

        if (!$employee) {
            return response()->json(['message' => 'Employee profile not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'check_out_latitude' => 'required|numeric',
            'check_out_longitude' => 'required|numeric',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $today = Carbon::today()->toDateString();
        $attendance = Attendance::where('employee_id', $employee->id)
            ->where('date', $today)
            ->first();

        if (!$attendance) {
            return response()->json(['message' => 'No check-in record found for today'], 404);
        }

        if ($attendance->check_out) {
            return response()->json([
                'message' => 'Already checked out today',
                'attendance' => $attendance
            ], 200); // Return 200 with existing record instead of 409
        }

        try {
            $attendance->update([
                'check_out' => now()->format('H:i:s'),
                'check_out_latitude' => $request->check_out_latitude,
                'check_out_longitude' => $request->check_out_longitude,
                'checked_out_by' => $user->id,
                'checkout_type' => 'manual',
            ]);

            return response()->json([
                'message' => 'Check-out successful',
                'attendance' => $attendance->fresh()
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to check out',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // =====================================
    // EMPLOYEE: VIEW OWN ATTENDANCE
    // =====================================
    public function myAttendance()
    {
        $user = auth()->user();

        if (!$user) {
            return response()->json(['message' => 'User not authenticated'], 401);
        }

        if ($user->role_id != 4) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $employee = $user->employee;

        if (!$employee) {
            return response()->json(['message' => 'Employee profile not found'], 404);
        }

        try {
            $records = Attendance::where('employee_id', $employee->id)
                ->orderByDesc('date')
                ->get()
                ->map(function ($record) use ($user) {
                    // Add remarks field
                    $remarks = '-';

                    if ($record->check_out) {
                        if (is_numeric($record->checked_out_by)) {
                            // Any numeric value is treated as a self-checkout to avoid showing raw IDs
                            $remarks = 'Checked out by self';
                        } elseif (in_array($record->checked_out_by, ['hr', 'admin', 'superadmin'])) {
                            $remarks = 'Checked out by ' . ucfirst($record->checked_out_by);
                        } else {
                            $remarks = 'Checked out by system';
                        }
                    }

                    $record->remarks = $remarks;
                    return $record;
                });

            return response()->json($records, 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to load attendance records',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // =====================================
    // GET PENDING CHECKOUTS (REMOVED - No longer needed)
    // =====================================
    public function getPendingCheckouts()
    {
        return response()->json([
            'pending_checkouts' => []
        ], 200);
    }

    // =====================================
    // CHECK OUT OLD SESSION (REMOVED - No longer needed)
    // =====================================
    public function checkoutOldSession(Request $request, $id)
    {
        return response()->json([
            'message' => 'This feature has been removed',
            'error' => 'feature_removed'
        ], 410);
    }

    // =====================================
    // ADMIN/HR/SUPERADMIN CHECK OUT EMPLOYEE
    // =====================================
    public function adminCheckoutEmployee(Request $request, $attendanceId)
    {
        $user = auth()->user();

        // Check permissions:
        // 1. SuperAdmin (1) - Always allowed
        // 2. Admin (2) / HR (3) - Allowed if they have 'can_force_checkout' permission

        $isSuperAdmin = $user->role_id == 1;
        $hasPermission = $user->can_force_checkout;

        if (!$isSuperAdmin && !$hasPermission) {
            return response()->json(['message' => 'Unauthorized - You do not have permission to force checkout employees'], 403);
        }

        // Find the attendance record
        $attendance = Attendance::find($attendanceId);

        if (!$attendance) {
            return response()->json(['message' => 'Attendance record not found'], 404);
        }

        if ($attendance->check_out) {
            return response()->json(['message' => 'Already checked out'], 400);
        }

        // Determine who is checking out
        $checkedOutBy = 'system';
        if ($user->role_id == 1)
            $checkedOutBy = 'superadmin';
        elseif ($user->role_id == 2)
            $checkedOutBy = 'admin';
        elseif ($user->role_id == 3)
            $checkedOutBy = 'hr';

        // Update the attendance record with checkout time
        $attendance->update([
            'check_out' => now()->format('H:i:s'),
            'checked_out_by' => $checkedOutBy,
            'checkout_type' => 'manual',
        ]);

        // Notify the employee
        $employee = $attendance->employee;
        if ($employee && $employee->user) {
            $this->notifications->sendToUser(
                $employee->user->id,
                "Checked Out by " . ucfirst($checkedOutBy),
                "You have been checked out by {$checkedOutBy} at {$attendance->check_out}",
                'attendance',
                "/employee/attendance"
            );
        }

        return response()->json([
            'message' => 'Employee checked out successfully',
            'attendance' => $attendance
        ]);
    }

    // =====================================
    // TEAM ATTENDANCE (Manager View)
    // =====================================
    public function teamAttendance(Request $request)
    {
        $user = auth()->user();

        if ($user->role_id != 4) {
            // Or allow Admin/HR to view specific teams later? For now, this is for Managers.
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

        // One row per member logic: Query Employees, not Attendance
        $date = $request->input('date', now()->toDateString());

        $query = Employee::with([
            'user:id,name,email',
            'department',
            'attendances' => function ($q) use ($date) {
                $q->where('date', $date);
            }
        ])
            ->whereIn('id', $subordinateIds);

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            });
        }

        $employees = $query->paginate(15);

        // Transform to include attendance status flatly
        $data = collect($employees->items())->map(function ($emp) {
            $att = $emp->attendances->first();
            return [
                'id' => $emp->id,
                'employee' => $emp, // Maintain structure or flatten? Frontend expects employee object nested often, but let's see.
                // Actually, let's look at the frontend. It expects `record.employee.user.name`.
                // If we return the employee as the root object, we can adapt frontend easily.
                'date' => $att ? $att->date : null, // Or requested date?
                'check_in' => $att ? $att->check_in : '-',
                'check_out' => $att ? $att->check_out : '-',
                'status' => $att ? $att->status : 'Absent',
            ];
        });

        // We need to return paginated structure but with our transformed data
        // setCollection won't change the structure of items if we return the paginator instance unless we handle it carefully.
        // Easiest is to return response()->json($employees) but the items are Employees with a 'attendances' relation.
        // Frontend expects `record.employee.user.name` and `record.check_in`.
        // If we return Employees, `record` IS the employee. `record.check_in` won't exist directly.
        // It's safer to transform on backend to match expected shape or update frontend.
        // Updating frontend is planned. So let's return a clean "Daily Status" object list.

        return response()->json([
            'data' => $data,
            'current_page' => $employees->currentPage(),
            'last_page' => $employees->lastPage(),
            'total' => $employees->total(),
            'from' => $employees->firstItem(),
            'to' => $employees->lastItem(),
        ]);
    }
    // =====================================
    // GET /api/attendance/summary
    // HR + Admin + SuperAdmin
    // =====================================
    public function summary(Request $request)
    {
        if (!in_array(auth()->user()->role_id, [1, 2, 3])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $month = $request->input('month', now()->format('Y-m'));
        $departmentId = $request->input('department_id');
        $status = $request->input('status'); // 'Present' or 'Absent' today
        $search = $request->input('search');

        // Get all employees
        $employeesQuery = Employee::with('user:id,name,email,role_id', 'department:id,name')
            ->whereHas('user', function ($q) {
                $q->where('is_active', true);
            });

        if ($departmentId) {
            $employeesQuery->where('department_id', $departmentId);
        }

        if ($status) {
            $today = now()->toDateString();
            if ($status === 'Present') {
                $employeesQuery->whereHas('attendances', function ($q) use ($today) {
                    $q->where('date', $today);
                });
            } elseif ($status === 'Absent') {
                $employeesQuery->whereDoesntHave('attendances', function ($q) use ($today) {
                    $q->where('date', $today);
                });
            }
        }

        if ($search) {
            $employeesQuery->where(function ($q) use ($search) {
                $q->where('employee_code', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($u) use ($search) {
                        $u->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $employees = $employeesQuery->paginate(15);

        // Process each employee
        // Determine Date Range
        if ($request->has('start_date') && $request->has('end_date')) {
            $startDate = \Carbon\Carbon::parse($request->start_date)->startOfDay();
            $endDate = \Carbon\Carbon::parse($request->end_date)->endOfDay();
        } else {
            $month = $request->input('month', now()->format('Y-m'));
            $startDate = \Carbon\Carbon::parse($month)->startOfMonth();
            $endDate = \Carbon\Carbon::parse($month)->endOfMonth();
        }

        // Process each employee
        $employees->getCollection()->transform(function ($employee) use ($startDate, $endDate) {
            // Fetch attendance for the calculated range
            $records = Attendance::where('employee_id', $employee->id)
                ->whereBetween('date', [$startDate, $endDate])
                ->get();

            // Today's status
            $todayRecord = Attendance::where('employee_id', $employee->id)
                ->where('date', now()->toDateString())
                ->first();

            $todayStatus = 'Absent';
            if ($todayRecord) {
                $todayStatus = $todayRecord->check_out ? 'Present' : 'Checked In';
            } else {
                // Check if Holiday
                if ($this->holidayService->getHolidayForEmployee(now()->toDateString(), $employee)) {
                    $todayStatus = 'Holiday';
                }
            }

            // Stats
            $totalDays = $records->count();

            // Calculate total hours (assuming we have working_hours or calculate from check_in/out)
            $totalHours = 0;
            $missingPunches = 0;
            $pendingCheckoutDates = []; // NEW: Array to store dates
            $lateDays = 0; // Logic for late days can be added if we have shift times

            foreach ($records as $record) {
                if ($record->check_in && $record->check_out) {
                    $in = \Carbon\Carbon::parse($record->check_in);
                    $out = \Carbon\Carbon::parse($record->check_out);
                    // Use minutes for precision
                    $totalHours += round($out->diffInMinutes($in) / 60, 2);
                } elseif ($record->check_in && !$record->check_out) {
                    $missingPunches++;
                    $pendingCheckoutDates[] = $record->date; // NEW: Add date
                }
            }

            return [
                'id' => $employee->id,
                'name' => $employee->user->name,
                'code' => $employee->employee_code,
                'department' => $employee->department ? $employee->department->name : '-', // Ensure department relates in model if needed, or eager load
                'today_status' => $todayStatus,
                'total_working_days' => $totalDays,
                'total_hours' => round($totalHours, 1),
                'missing_punches' => $missingPunches,
                'pending_checkout_dates' => $pendingCheckoutDates, // NEW: Return dates
            ];
        });

        return response()->json([
            'data' => $employees->items(),
            'current_page' => $employees->currentPage(),
            'last_page' => $employees->lastPage(),
            'total' => $employees->total(),
            'from' => $employees->firstItem(),
            'to' => $employees->lastItem(),
        ]);
    }

    // =====================================
    // GET /api/attendance/employee/{id}
    // HR + Admin + SuperAdmin (View specific employee history)
    // =====================================
    public function employeeHistory(Request $request, $id)
    {
        $user = auth()->user();

        $canAccess = false;
        // 1=Admin, 2=HR, 3=SuperAdmin
        if (in_array($user->role_id, [1, 2, 3])) {
            $canAccess = true;
        }
        // 4=Employee (Manager)
        elseif ($user->role_id == 4 && $user->employee) {
            // Check if target employee is a subordinate
            $subordinates = $user->employee->getAllSubordinateIds();
            if ($subordinates->contains((int) $id) || $user->employee->id == $id) {
                $canAccess = true;
            }
        }

        if (!$canAccess) {
            $debug = [
                'user_id' => $user->id,
                'role_id' => $user->role_id,
                'user_emp_id' => $user->employee ? $user->employee->id : 'null',
                'target_id' => $id,
                'target_id_type' => gettype($id),
                'subordinates' => isset($subordinates) ? $subordinates->values()->all() : 'not_fetched',
            ];
            return response()->json(['message' => 'Unauthorized', 'debug' => $debug], 403);
        }

        $month = $request->input('month', now()->format('Y-m'));
        $startDate = \Carbon\Carbon::parse($month)->startOfMonth();
        $endDate = \Carbon\Carbon::parse($month)->endOfMonth();

        $employee = Employee::findOrFail($id);
        $joiningDate = $employee->date_of_joining ? \Carbon\Carbon::parse($employee->date_of_joining) : null;

        // Limit end date to today if we are viewing the current month
        if ($endDate->isFuture()) {
            $endDate = now();
        }

        // Adjust Start Date based on Joining Date
        if ($joiningDate && $joiningDate->gt($startDate)) {
            $startDate = $joiningDate;
        }

        // Fetch existing records keyed by date
        $attendanceRecords = Attendance::where('employee_id', $id)
            ->whereBetween('date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
            ->get()
            ->keyBy('date');

        $fullHistory = [];
        $currentDate = $startDate->copy();

        while ($currentDate->lte($endDate)) {
            $dateString = $currentDate->toDateString();

            if (isset($attendanceRecords[$dateString])) {
                $record = $attendanceRecords[$dateString];
                $totalHours = 0;
                if ($record->check_in && $record->check_out) {
                    $in = \Carbon\Carbon::parse($record->check_in);
                    $out = \Carbon\Carbon::parse($record->check_out);
                    // Use minutes for precision
                    $totalHours = round($out->diffInMinutes($in) / 60, 2);
                }

                $fullHistory[] = [
                    'id' => $record->id,
                    'date' => $record->date,
                    'check_in' => $record->check_in,
                    'check_out' => $record->check_out,
                    'total_hours' => round($totalHours, 1),
                    'status' => $record->status,
                    'check_in_latitude' => $record->check_in_latitude,
                    'check_in_longitude' => $record->check_in_longitude,
                    'check_out_latitude' => $record->check_out_latitude,
                    'check_out_longitude' => $record->check_out_longitude,
                    'device_id' => $record->device_id,
                    'device_type' => $record->device_type,
                    'browser' => $record->browser,
                    'ip_address' => $record->ip_address,
                ];
            } else {
                // Determine if it's a weekend or holiday
                if ($currentDate->isSunday()) {
                    $status = 'Weekend';
                    $checkIn = '-';
                    $checkOut = '-';
                } elseif ($holiday = $this->holidayService->getHolidayForEmployee($dateString, $employee)) {
                    $status = 'Holiday: ' . $holiday->name;
                    $checkIn = '-';
                    $checkOut = '-';
                } else {
                    $status = 'Absent';
                    $checkIn = '-';
                    $checkOut = '-';
                }

                $fullHistory[] = [
                    'id' => 'absent_' . $dateString,
                    'date' => $dateString,
                    'check_in' => $checkIn,
                    'check_out' => $checkOut,
                    'total_hours' => 0,
                    'status' => $status,
                ];
            }

            $currentDate->addDay();
        }

        // Sort by date descending
        usort($fullHistory, function ($a, $b) {
            return strtotime($b['date']) - strtotime($a['date']);
        });

        return response()->json($fullHistory);
    }

    // =====================================
    // START OVERTIME
    // =====================================
    public function startOvertime(Request $request)
    {
        $user = auth()->user();

        if ($user->role_id != 4) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $employee = $user->employee;

        // Check if overtime is enabled for this employee
        if (!$employee->overtime_enabled) {
            return response()->json([
                'message' => 'Overtime is not enabled for your account. Please contact HR/Admin.',
                'error' => 'overtime_disabled'
            ], 403);
        }

        $today = now()->toDateString();
        $attendance = Attendance::where('employee_id', $employee->id)
            ->where('date', $today)
            ->first();

        if (!$attendance) {
            return response()->json(['message' => 'No check-in record found for today'], 404);
        }

        if (!$attendance->check_out) {
            return response()->json(['message' => 'Please check out first before starting overtime'], 400);
        }

        if ($attendance->overtime_start) {
            return response()->json(['message' => 'Overtime already started'], 409);
        }

        $attendance->update([
            'overtime_start' => now()->format('H:i:s')
        ]);

        // Notify HR
        $this->notifications->sendToRoles(
            [3],
            "Overtime Started",
            "{$employee->user->name} started overtime at {$attendance->overtime_start}",
            "attendance",
            "/hr/attendance"
        );

        return response()->json([
            'message' => 'Overtime started successfully',
            'attendance' => $attendance
        ], 200);
    }

    // =====================================
    // END OVERTIME
    // =====================================
    public function endOvertime(Request $request)
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
            return response()->json(['message' => 'No check-in record found for today'], 404);
        }

        if (!$attendance->overtime_start) {
            return response()->json(['message' => 'Overtime not started yet'], 400);
        }

        if ($attendance->overtime_end) {
            return response()->json(['message' => 'Overtime already ended'], 409);
        }

        $overtimeEnd = now()->format('H:i:s');

        // Calculate overtime hours
        $start = \Carbon\Carbon::parse($attendance->overtime_start);
        $end = \Carbon\Carbon::parse($overtimeEnd);
        $overtimeHours = $end->diffInMinutes($start) / 60;

        $attendance->update([
            'overtime_end' => $overtimeEnd,
            'overtime_hours' => round($overtimeHours, 2)
        ]);

        // Notify HR
        $this->notifications->sendToRoles(
            [3],
            "Overtime Ended",
            "{$employee->user->name} ended overtime at {$overtimeEnd}. Total: {$attendance->overtime_hours} hours",
            "attendance",
            "/hr/attendance"
        );

        return response()->json([
            'message' => 'Overtime ended successfully',
            'attendance' => $attendance
        ], 200);
    }
}
