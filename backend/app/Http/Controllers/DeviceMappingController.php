<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Employee;
use App\Models\Attendance;
use Illuminate\Support\Facades\Storage;

class DeviceMappingController extends Controller
{
    /**
     * Get all detected device user IDs from events and attendance records
     */
    public function getDetectedDeviceUsers()
    {
        if (auth()->user()->role_id !== 1) {
            return response()->json(['error' => 'Unauthorized. SuperAdmin access only.'], 403);
        }

        $deviceUsers = [];

        // Source 1: Read from hikvision_events.json
        if (Storage::exists('hikvision_events.json')) {
            $eventsJson = Storage::get('hikvision_events.json');
            $events = json_decode($eventsJson, true) ?? [];
            
            foreach ($events as $event) {
                if (isset($event['employeeNoString'])) {
                    $deviceUserId = $event['employeeNoString'];
                    if (!isset($deviceUsers[$deviceUserId])) {
                        $deviceUsers[$deviceUserId] = [
                            'device_user_id' => $deviceUserId,
                            'first_seen' => $event['dateTime'] ?? null,
                            'event_count' => 0,
                            'mapped_to' => null
                        ];
                    }
                    $deviceUsers[$deviceUserId]['event_count']++;
                }
            }
        }

        // Source 2: Read from attendances.device_metadata
        $attendances = Attendance::whereNotNull('device_metadata')->get();
        foreach ($attendances as $attendance) {
            $metadata = json_decode($attendance->device_metadata, true);
            if (isset($metadata['employeeNoString'])) {
                $deviceUserId = $metadata['employeeNoString'];
                if (!isset($deviceUsers[$deviceUserId])) {
                    $deviceUsers[$deviceUserId] = [
                        'device_user_id' => $deviceUserId,
                        'first_seen' => $attendance->date . ' ' . $attendance->check_in,
                        'event_count' => 0,
                        'mapped_to' => null
                    ];
                }
            }
        }

        // Check which device users are already mapped
        $mappedEmployees = Employee::whereNotNull('device_user_id')->get();
        foreach ($mappedEmployees as $employee) {
            if (isset($deviceUsers[$employee->device_user_id])) {
                $deviceUsers[$employee->device_user_id]['mapped_to'] = [
                    'id' => $employee->id,
                    'name' => $employee->first_name . ' ' . $employee->last_name,
                    'employee_code' => $employee->employee_code
                ];
            }
        }

        return response()->json([
            'success' => true,
            'device_users' => array_values($deviceUsers),
            'total' => count($deviceUsers),
            'mapped' => count(array_filter($deviceUsers, fn($u) => $u['mapped_to'] !== null)),
            'unmapped' => count(array_filter($deviceUsers, fn($u) => $u['mapped_to'] === null))
        ]);
    }

    /**
     * Get all employees without device_user_id mapping
     */
    public function getUnmappedEmployees()
    {
        if (auth()->user()->role_id !== 1) {
            return response()->json(['error' => 'Unauthorized. SuperAdmin access only.'], 403);
        }

        $employees = Employee::with('department')
            ->whereNull('device_user_id')
            ->orderBy('employee_code')
            ->get()
            ->map(function ($emp) {
                return [
                    'id' => $emp->id,
                    'employee_code' => $emp->employee_code,
                    'name' => $emp->first_name . ' ' . $emp->last_name,
                    'department' => $emp->department->name ?? 'N/A',
                    'email' => $emp->email
                ];
            });

        return response()->json([
            'success' => true,
            'employees' => $employees,
            'total' => $employees->count()
        ]);
    }

    /**
     * Get all employees with device_user_id mapping
     */
    public function getMappedEmployees()
    {
        if (auth()->user()->role_id !== 1) {
            return response()->json(['error' => 'Unauthorized. SuperAdmin access only.'], 403);
        }

        $employees = Employee::with('department')
            ->whereNotNull('device_user_id')
            ->orderBy('employee_code')
            ->get()
            ->map(function ($emp) {
                return [
                    'id' => $emp->id,
                    'employee_code' => $emp->employee_code,
                    'name' => $emp->first_name . ' ' . $emp->last_name,
                    'department' => $emp->department->name ?? 'N/A',
                    'device_user_id' => $emp->device_user_id,
                    'email' => $emp->email
                ];
            });

        return response()->json([
            'success' => true,
            'employees' => $employees,
            'total' => $employees->count()
        ]);
    }

    /**
     * Map a single employee to a device user ID
     */
    public function mapEmployee(Request $request)
    {
        if (auth()->user()->role_id !== 1) {
            return response()->json(['error' => 'Unauthorized. SuperAdmin access only.'], 403);
        }

        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'device_user_id' => 'required|string'
        ]);

        // Check if device_user_id is already mapped to another employee
        $existingMapping = Employee::where('device_user_id', $request->device_user_id)
            ->where('id', '!=', $request->employee_id)
            ->first();

        if ($existingMapping) {
            return response()->json([
                'error' => 'Device User ID already mapped',
                'message' => \"Device User ID {$request->device_user_id} is already mapped to {$existingMapping->first_name} {$existingMapping->last_name} (Code: {$existingMapping->employee_code})\"
            ], 409);
        }

        $employee = Employee::find($request->employee_id);
        $employee->device_user_id = $request->device_user_id;
        $employee->save();

        return response()->json([
            'success' => true,
            'message' => 'Employee mapped successfully',
            'employee' => [
                'id' => $employee->id,
                'name' => $employee->first_name . ' ' . $employee->last_name,
                'employee_code' => $employee->employee_code,
                'device_user_id' => $employee->device_user_id
            ]
        ]);
    }

    /**
     * Bulk map multiple employees to device user IDs
     */
    public function bulkMapEmployees(Request $request)
    {
        if (auth()->user()->role_id !== 1) {
            return response()->json(['error' => 'Unauthorized. SuperAdmin access only.'], 403);
        }

        $request->validate([
            'mappings' => 'required|array',
            'mappings.*.employee_id' => 'required|exists:employees,id',
            'mappings.*.device_user_id' => 'required|string'
        ]);

        $mappings = $request->mappings;
        $results = [
            'success' => [],
            'failed' => [],
            'skipped' => []
        ];

        // Check for conflicts first
        $deviceUserIds = array_column($mappings, 'device_user_id');
        $existingMappings = Employee::whereIn('device_user_id', $deviceUserIds)->get();
        
        \DB::beginTransaction();
        try {
            foreach ($mappings as $mapping) {
                $employeeId = $mapping['employee_id'];
                $deviceUserId = $mapping['device_user_id'];

                // Check if already mapped to another employee
                $conflict = $existingMappings->first(function ($emp) use ($deviceUserId, $employeeId) {
                    return $emp->device_user_id === $deviceUserId && $emp->id !== $employeeId;
                });

                if ($conflict) {
                    $results['failed'][] = [
                        'employee_id' => $employeeId,
                        'device_user_id' => $deviceUserId,
                        'reason' => \"Already mapped to {$conflict->first_name} {$conflict->last_name}\"
                    ];
                    continue;
                }

                $employee = Employee::find($employeeId);
                
                // Skip if already has same mapping
                if ($employee->device_user_id === $deviceUserId) {
                    $results['skipped'][] = [
                        'employee_id' => $employeeId,
                        'device_user_id' => $deviceUserId,
                        'reason' => 'Already mapped'
                    ];
                    continue;
                }

                $employee->device_user_id = $deviceUserId;
                $employee->save();

                $results['success'][] = [
                    'employee_id' => $employee->id,
                    'name' => $employee->first_name . ' ' . $employee->last_name,
                    'employee_code' => $employee->employee_code,
                    'device_user_id' => $deviceUserId
                ];
            }

            \DB::commit();

            return response()->json([
                'success' => true,
                'message' => count($results['success']) . ' employees mapped successfully',
                'results' => $results
            ]);

        } catch (\Exception $e) {
            \DB::rollBack();
            return response()->json([
                'error' => 'Bulk mapping failed',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove device mapping from an employee
     */
    public function unmapEmployee($employeeId)
    {
        if (auth()->user()->role_id !== 1) {
            return response()->json(['error' => 'Unauthorized. SuperAdmin access only.'], 403);
        }

        $employee = Employee::find($employeeId);
        
        if (!$employee) {
            return response()->json(['error' => 'Employee not found'], 404);
        }

        $oldDeviceUserId = $employee->device_user_id;
        $employee->device_user_id = null;
        $employee->save();

        return response()->json([
            'success' => true,
            'message' => 'Employee unmapped successfully',
            'employee' => [
                'id' => $employee->id,
                'name' => $employee->first_name . ' ' . $employee->last_name,
                'employee_code' => $employee->employee_code,
                'old_device_user_id' => $oldDeviceUserId
            ]
        ]);
    }

    /**
     * Auto-suggest mappings based on patterns (AI-powered matching)
     */
    public function autoSuggestMappings()
    {
        if (auth()->user()->role_id !== 1) {
            return response()->json(['error' => 'Unauthorized. SuperAdmin access only.'], 403);
        }

        // Get detected device users that are unmapped
        $deviceUsersResponse = $this->getDetectedDeviceUsers();
        $deviceUsersData = json_decode($deviceUsersResponse->content(), true);
        $unmappedDeviceUsers = array_filter($deviceUsersData['device_users'], fn($u) => $u['mapped_to'] === null);

        // Get unmapped employees
        $unmappedEmployeesResponse = $this->getUnmappedEmployees();
        $unmappedEmployeesData = json_decode($unmappedEmployeesResponse->content(), true);
        $unmappedEmployees = $unmappedEmployeesData['employees'];

        $suggestions = [];

        foreach ($unmappedDeviceUsers as $deviceUser) {
            $deviceUserId = $deviceUser['device_user_id'];

            foreach ($unmappedEmployees as $employee) {
                $confidence = 0;
                $reasons = [];

                // Pattern 1: Exact match with employee code number (highest confidence)
                if ($employee['employee_code'] === $deviceUserId) {
                    $confidence = 90;
                    $reasons[] = 'Exact employee code match';
                }
                // Pattern 2: Employee code contains device user ID with padding (e.g., EMP013 matches 13)
                elseif (preg_match('/0*' . preg_quote($deviceUserId, '/') . '$/', $employee['employee_code'])) {
                    $confidence = 85;
                    $reasons[] = 'Employee code contains device ID with padding';
                }
                // Pattern 3: Device user ID appears in employee code
                elseif (strpos($employee['employee_code'], $deviceUserId) !== false) {
                    $confidence = 70;
                    $reasons[] = 'Device ID found in employee code';
                }
                // Pattern 4: Match by employee database ID
                elseif ((string)$employee['id'] === $deviceUserId) {
                    $confidence = 60;
                    $reasons[] = 'Matches employee database ID';
                }

                if ($confidence > 0) {
                    $suggestions[] = [
                        'employee_id' => $employee['id'],
                        'employee_code' => $employee['employee_code'],
                        'employee_name' => $employee['name'],
                        'department' => $employee['department'],
                        'device_user_id' => $deviceUserId,
                        'confidence' => $confidence,
                        'reasons' => $reasons,
                        'auto_apply' => $confidence >= 80
                    ];
                    break; // Only suggest one match per device user
                }
            }
        }

        // Sort by confidence (highest first)
        usort($suggestions, fn($a, $b) => $b['confidence'] - $a['confidence']);

        return response()->json([
            'success' => true,
            'suggestions' => $suggestions,
            'total' => count($suggestions),
            'high_confidence' => count(array_filter($suggestions, fn($s) => $s['confidence'] >= 80)),
            'medium_confidence' => count(array_filter($suggestions, fn($s) => $s['confidence'] >= 60 && $s['confidence'] < 80))
        ]);
    }

    /**
     * Get statistics for device mapping dashboard
     */
    public function getStatistics()
    {
        if (auth()->user()->role_id !== 1) {
            return response()->json(['error' => 'Unauthorized. SuperAdmin access only.'], 403);
        }

        $totalEmployees = Employee::count();
        $mappedEmployees = Employee::whereNotNull('device_user_id')->count();
        $unmappedEmployees = $totalEmployees - $mappedEmployees;
        $mappingPercentage = $totalEmployees > 0 ? round(($mappedEmployees / $totalEmployees) * 100, 1) : 0;

        // Get detected device users count
        $deviceUsersResponse = $this->getDetectedDeviceUsers();
        $deviceUsersData = json_decode($deviceUsersResponse->content(), true);
        $totalDeviceUsers = $deviceUsersData['total'];
        $unmappedDeviceUsers = $deviceUsersData['unmapped'];

        // Get recent mappings (last 10)
        $recentMappings = Employee::whereNotNull('device_user_id')
            ->with('department')
            ->orderBy('updated_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($emp) {
                return [
                    'id' => $emp->id,
                    'employee_code' => $emp->employee_code,
                    'name' => $emp->first_name . ' ' . $emp->last_name,
                    'department' => $emp->department->name ?? 'N/A',
                    'device_user_id' => $emp->device_user_id,
                    'mapped_at' => $emp->updated_at->format('Y-m-d H:i:s')
                ];
            });

        return response()->json([
            'success' => true,
            'statistics' => [
                'total_employees' => $totalEmployees,
                'mapped_employees' => $mappedEmployees,
                'unmapped_employees' => $unmappedEmployees,
                'mapping_percentage' => $mappingPercentage,
                'total_device_users' => $totalDeviceUsers,
                'unmapped_device_users' => $unmappedDeviceUsers,
                'recent_mappings' => $recentMappings
            ]
        ]);
    }
}
