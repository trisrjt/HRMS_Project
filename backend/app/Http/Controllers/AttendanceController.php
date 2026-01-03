<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Attendance;
use App\Models\Employee;
use App\Services\NotificationService;
use App\Services\HolidayService; // Import

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
        if (!in_array(auth()->user()->role_id, [1,2,3])) {
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

        $query = Employee::with(['user:id,name,email', 'department', 'attendances' => function($q) use ($date) {
                $q->where('date', $date);
            }])
            ->whereIn('id', $subordinateIds);

        if ($request->has('search') && $request->search) {
             $search = $request->search;
             $query->whereHas('user', function($q) use ($search) {
                 $q->where('name', 'like', "%{$search}%");
             });
        }

        $employees = $query->paginate(15);

        // Transform to include attendance status flatly
        $data = $employees->getCollection()->map(function($emp) {
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
                'p_employee' => $emp, // Helper for frontend to access user data easily if we don't map `employee` key
                // To minimize frontend breakage, let's mock the structure needed:
                'employee' => $emp, 
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
        $summary = $employees->getCollection()->map(function ($employee) use ($month) {
            $startDate = \Carbon\Carbon::parse($month)->startOfMonth();
            $endDate = \Carbon\Carbon::parse($month)->endOfMonth();

            // Fetch attendance for this month
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
            $lateDays = 0; // Logic for late days can be added if we have shift times

            foreach ($records as $record) {
                if ($record->check_in && $record->check_out) {
                    $in = \Carbon\Carbon::parse($record->check_in);
                    $out = \Carbon\Carbon::parse($record->check_out);
                    $totalHours += $out->diffInHours($in);
                } elseif ($record->check_in && !$record->check_out) {
                    $missingPunches++;
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
            ];
        });

        return response()->json([
            'data' => $summary,
            'current_page' => $employees->currentPage(),
            'last_page' => $employees->lastPage(),
            'total' => $employees->total(),
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
            if ($subordinates->contains((int)$id) || $user->employee->id == $id) {
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
                    $totalHours = $out->diffInHours($in);
                }

                $fullHistory[] = [
                    'id' => $record->id,
                    'date' => $record->date,
                    'check_in' => $record->check_in,
                    'check_out' => $record->check_out,
                    'total_hours' => round($totalHours, 1),
                    'status' => $record->status,
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
}