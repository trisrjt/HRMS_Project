<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\User;

class SuperAdminBiometricController extends Controller
{
    /**
     * List all biometric attendance records (SuperAdmin only)
     */
    public function index(Request $request)
    {
        // Check if user is SuperAdmin (role_id = 1)
        if (auth()->user()->role_id !== 1) {
            return response()->json(['error' => 'Unauthorized. SuperAdmin access only.'], 403);
        }
        
        $query = Attendance::with('employee')
            ->whereNotNull('biometric_method');
        
        // Filter by date range
        if ($request->has('start_date')) {
            $query->where('date', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->where('date', '<=', $request->end_date);
        }
        
        // Filter by employee
        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }
        
        // Filter by biometric method
        if ($request->has('method')) {
            $query->where('biometric_method', $request->input('method'));
        }
        
        // Order by most recent
        $query->orderBy('date', 'desc')->orderBy('check_in', 'desc');
        
        // Paginate results
        $perPage = $request->input('per_page', 15);
        $attendances = $query->paginate($perPage);
        
        return response()->json($attendances);
    }
    
    /**
     * Get detailed biometric attendance record
     */
    public function show($id)
    {
        // Check if user is SuperAdmin
        if (auth()->user()->role_id !== 1) {
            return response()->json(['error' => 'Unauthorized. SuperAdmin access only.'], 403);
        }
        
        $attendance = Attendance::with('employee')->find($id);
        
        if (!$attendance) {
            return response()->json(['error' => 'Attendance record not found'], 404);
        }
        
        return response()->json($attendance);
    }
    
    /**
     * Grant biometric data access to HR/Admin users
     */
    public function grantAccess(Request $request)
    {
        // Check if user is SuperAdmin
        if (auth()->user()->role_id !== 1) {
            return response()->json(['error' => 'Unauthorized. SuperAdmin access only.'], 403);
        }
        
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'access_type' => 'required|in:view,manage,none'
        ]);
        
        $user = User::find($request->user_id);
        
        // Only allow granting access to HR (role 3) or Admin (role 2)
        if (!in_array($user->role_id, [2, 3])) {
            return response()->json(['error' => 'Can only grant access to HR or Admin users'], 400);
        }
        
        // Store permission (you may want to create a permissions table for this)
        // For now, we'll use a simple JSON column in users table
        $permissions = $user->permissions ?? [];
        $permissions['biometric_access'] = $request->access_type;
        $user->permissions = $permissions;
        $user->save();
        
        return response()->json([
            'message' => 'Access granted successfully',
            'user' => $user->name,
            'access' => $request->access_type
        ]);
    }
    
    /**
     * Check if user has biometric access
     */
    public function checkAccess()
    {
        $user = auth()->user();
        
        // SuperAdmin always has full access
        if ($user->role_id === 1) {
            return response()->json(['access' => 'manage']);
        }
        
        // Check if HR/Admin has granted permission
        if (in_array($user->role_id, [2, 3])) {
            $permissions = $user->permissions ?? [];
            $access = $permissions['biometric_access'] ?? 'none';
            return response()->json(['access' => $access]);
        }
        
        // Employees have no access
        return response()->json(['access' => 'none']);
    }
    
    /**
     * Export biometric attendance report
     */
    public function exportReport(Request $request)
    {
        // Check if user is SuperAdmin
        if (auth()->user()->role_id !== 1) {
            return response()->json(['error' => 'Unauthorized. SuperAdmin access only.'], 403);
        }
        
        $query = Attendance::with('employee')
            ->whereNotNull('biometric_method');
        
        // Apply filters
        if ($request->has('start_date')) {
            $query->where('date', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->where('date', '<=', $request->end_date);
        }
        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }
        if ($request->has('method')) {
            $query->where('biometric_method', $request->input('method'));
        }
        
        $attendances = $query->orderBy('date', 'desc')->get();
        
        // Prepare CSV data
        $csvData = [];
        $csvData[] = [
            'Date',
            'Employee Code',
            'Employee Name',
            'Check In',
            'Check Out',
            'Biometric Method',
            'Device ID',
            'Status',
            'Snapshot Available'
        ];
        
        foreach ($attendances as $attendance) {
            $csvData[] = [
                $attendance->date,
                $attendance->employee->employee_code,
                $attendance->employee->first_name . ' ' . $attendance->employee->last_name,
                $attendance->check_in,
                $attendance->check_out ?? 'N/A',
                $attendance->biometric_method,
                $attendance->device_id,
                $attendance->status,
                $attendance->face_snapshot_url ? 'Yes' : 'No'
            ];
        }
        
        // Generate CSV file
        $filename = 'biometric_attendance_' . date('Y-m-d_His') . '.csv';
        $filepath = storage_path('app/public/reports/' . $filename);
        
        // Create directory if it doesn't exist
        if (!file_exists(dirname($filepath))) {
            mkdir(dirname($filepath), 0755, true);
        }
        
        $handle = fopen($filepath, 'w');
        foreach ($csvData as $row) {
            fputcsv($handle, $row);
        }
        fclose($handle);
        
        return response()->json([
            'message' => 'Report exported successfully',
            'filename' => $filename,
            'download_url' => url('storage/reports/' . $filename),
            'total_records' => count($attendances)
        ]);
    }
    
    /**
     * Get statistics for biometric attendance
     */
    public function statistics(Request $request)
    {
        // Check if user is SuperAdmin
        if (auth()->user()->role_id !== 1) {
            return response()->json(['error' => 'Unauthorized. SuperAdmin access only.'], 403);
        }
        
        $startDate = $request->input('start_date', now()->subDays(30)->toDateString());
        $endDate = $request->input('end_date', now()->toDateString());
        
        $totalBiometric = Attendance::whereNotNull('biometric_method')
            ->whereBetween('date', [$startDate, $endDate])
            ->count();
        
        $byMethod = Attendance::whereNotNull('biometric_method')
            ->whereBetween('date', [$startDate, $endDate])
            ->selectRaw('biometric_method, COUNT(*) as count')
            ->groupBy('biometric_method')
            ->get();
        
        $withSnapshots = Attendance::whereNotNull('face_snapshot_url')
            ->whereBetween('date', [$startDate, $endDate])
            ->count();
        
        $uniqueEmployees = Attendance::whereNotNull('biometric_method')
            ->whereBetween('date', [$startDate, $endDate])
            ->distinct('employee_id')
            ->count();
        
        return response()->json([
            'total_biometric_attendance' => $totalBiometric,
            'attendance_by_method' => $byMethod,
            'with_snapshots' => $withSnapshots,
            'unique_employees' => $uniqueEmployees,
            'date_range' => [
                'start' => $startDate,
                'end' => $endDate
            ]
        ]);
    }
}
