<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http as HttpClient;
use App\Services\HikvisionService;

class HikvisionController extends Controller
{
    protected $hikService;

    public function __construct(HikvisionService $hikService)
    {
        $this->hikService = $hikService;
    }

    // Generic webhook endpoint for device events
    public function webhook(Request $request)
    {
        // Verify HMAC signature if configured
        $secret = env('HIKVISION_WEBHOOK_SECRET', null);
        if ($secret) {
            $signature = $request->header('X-Hik-Signature') ?? $request->header('X-Hub-Signature');
            $raw = $request->getContent();
            $computed = 'sha256=' . hash_hmac('sha256', $raw, $secret);
            if (!$signature || !hash_equals($computed, $signature)) {
                return response()->json(['error' => 'invalid_signature'], 401);
            }
        }

        $payload = $request->all();
        $event = $this->hikService->storeEvent($payload);
        
        // Process attendance event automatically
        $this->processAttendanceEvent($payload);
        
        return response()->json(['status' => 'ok', 'event' => $event]);
    }
    
    // Process Hikvision event and create attendance record with biometric data
    protected function processAttendanceEvent($payload)
    {
        try {
            // Parse event_log if it's a JSON string
            $eventData = $payload;
            if (isset($payload['event_log']) && is_string($payload['event_log'])) {
                $eventData = json_decode($payload['event_log'], true) ?? $payload;
            }
            
            // Extract employee ID from device
            $deviceUserId = $eventData['AccessControllerEvent']['employeeNoString'] ?? 
                           $eventData['employeeNoString'] ?? 
                           $eventData['user_id'] ?? null;
                           
            if (!$deviceUserId) {
                return; // No user ID, skip
            }
            
            // Get attendance status from event
            $attendanceStatus = $eventData['AccessControllerEvent']['attendanceStatus'] ?? 
                              $eventData['attendanceStatus'] ?? 
                              'undefined';
                              
            // Skip if not a check-in or check-out event
            if (!in_array($attendanceStatus, ['checkIn', 'checkOut', 'overtimeIn', 'overtimeOut'])) {
                return;
            }
            
            // Find employee by device user ID mapping
            $employee = \App\Models\Employee::where('device_user_id', $deviceUserId)->first();
            
            if (!$employee) {
                // Fallback: try to find by employee_code if it matches
                $employee = \App\Models\Employee::where('employee_code', $deviceUserId)->first();
            }
            
            if (!$employee) {
                \Log::info("Hikvision: No employee found for device user ID: {$deviceUserId}");
                return;
            }
            
            $date = now()->toDateString();
            $time = now()->toTimeString();
            
            // Get predefined device location from env or config
            $deviceLat = env('HIKVISION_DEVICE_LATITUDE', '0.0');
            $deviceLng = env('HIKVISION_DEVICE_LONGITUDE', '0.0');
            
            // Determine biometric method
            $biometricMethod = $this->detectBiometricMethod($eventData);
            
            // Capture and save face snapshot if available
            $faceSnapshotPath = null;
            if ($biometricMethod === 'face' || isset($eventData['AccessControllerEvent']['pictureURL'])) {
                $faceSnapshotPath = $this->captureFaceSnapshot($eventData, $employee->id, $date);
            }
            
            // Generate unique device event ID
            $deviceEventId = 'hik_' . time() . '_' . uniqid();
            
            // Prepare device metadata
            $deviceMetadata = [
                'device_ip' => $eventData['ipAddress'] ?? env('HIKVISION_DEVICE_IP', 'unknown'),
                'device_name' => $eventData['deviceName'] ?? 'Hikvision Terminal',
                'face_rect' => $eventData['AccessControllerEvent']['FaceRect'] ?? null,
                'card_no' => $eventData['AccessControllerEvent']['cardNo'] ?? null,
                'raw_event' => $eventData
            ];
            
            // Check if attendance record exists for today
            $attendance = \App\Models\Attendance::where('employee_id', $employee->id)
                ->where('date', $date)
                ->first();
            
            if ($attendanceStatus === 'checkIn' && !$attendance) {
                // Create new check-in with biometric data
                \App\Models\Attendance::create([
                    'employee_id' => $employee->id,
                    'date' => $date,
                    'check_in' => $time,
                    'check_in_latitude' => $deviceLat,
                    'check_in_longitude' => $deviceLng,
                    'device_id' => 'hikvision_' . ($eventData['ipAddress'] ?? 'terminal'),
                    'device_type' => 'Hikvision Face Terminal',
                    'browser' => 'Hikvision Device',
                    'checked_in_by' => 'device',
                    'status' => 'Present',
                    'biometric_method' => $biometricMethod,
                    'face_snapshot_url' => $faceSnapshotPath,
                    'device_event_id' => $deviceEventId,
                    'device_metadata' => $deviceMetadata,
                ]);
                
                \Log::info("Hikvision: Check-in recorded for employee {$employee->employee_code} via {$biometricMethod}");
                
            } elseif ($attendanceStatus === 'checkOut' && $attendance && !$attendance->check_out) {
                // Update with check-out
                $attendance->update([
                    'check_out' => $time,
                    'check_out_latitude' => $deviceLat,
                    'check_out_longitude' => $deviceLng,
                    'checked_out_by' => 'device',
                ]);
                
                \Log::info("Hikvision: Check-out recorded for employee {$employee->employee_code}");
            }
            
        } catch (\Exception $e) {
            \Log::error("Hikvision attendance processing error: " . $e->getMessage());
        }
    }
    
    // Detect biometric method from event data
    protected function detectBiometricMethod($eventData)
    {
        // Check for face-related data
        if (isset($eventData['AccessControllerEvent']['FaceRect']) || 
            isset($eventData['AccessControllerEvent']['pictureURL']) ||
            isset($eventData['face_data'])) {
            return 'face';
        }
        
        // Check for fingerprint-related data
        if (isset($eventData['AccessControllerEvent']['fingerPrintData']) ||
            isset($eventData['fingerprint_data']) ||
            isset($eventData['cardType']) && $eventData['cardType'] === 'fingerprint') {
            return 'fingerprint';
        }
        
        // Check for card-based access
        if (isset($eventData['AccessControllerEvent']['cardNo'])) {
            return 'card';
        }
        
        return 'unknown';
    }
    
    // Capture and save face snapshot from device
    protected function captureFaceSnapshot($eventData, $employeeId, $date)
    {
        try {
            // Try to get snapshot URL from event
            $snapshotUrl = $eventData['AccessControllerEvent']['pictureURL'] ?? null;
            
            if (!$snapshotUrl) {
                // Build snapshot URL using device IP and standard ISAPI path
                $deviceIp = $eventData['ipAddress'] ?? env('HIKVISION_DEVICE_IP');
                if (!$deviceIp) {
                    return null;
                }
                
                // Try common snapshot endpoints
                $snapshotUrl = "http://{$deviceIp}/ISAPI/Streaming/channels/1/picture";
            }
            
            // Fetch snapshot from device
            $username = env('HIKVISION_DEVICE_USER', 'admin');
            $password = env('HIKVISION_DEVICE_PASS', '');
            
            $client = HttpClient::withOptions(['verify' => false, 'timeout' => 5]);
            if ($username) {
                $client = $client->withBasicAuth($username, $password);
            }
            
            $response = $client->get($snapshotUrl);
            
            if ($response->failed()) {
                \Log::warning("Failed to fetch snapshot from {$snapshotUrl}: " . $response->status());
                return null;
            }
            
            // Save snapshot to storage
            $imageContent = $response->body();
            $timestamp = now()->format('YmdHis');
            $filename = "biometric_{$employeeId}_{$date}_{$timestamp}.jpg";
            $directory = 'public/biometric_snapshots/' . date('Y/m');
            $path = $directory . '/' . $filename;
            
            \Storage::makeDirectory($directory);
            \Storage::put($path, $imageContent);
            
            // Return public URL path
            return str_replace('public/', 'storage/', $path);
            
        } catch (\Exception $e) {
            \Log::error("Face snapshot capture error: " . $e->getMessage());
            return null;
        }
    }

    // Return recent events (for frontend testing)
    public function events(Request $request)
    {
        $limit = (int) $request->query('limit', 50);
        $events = $this->hikService->getRecentEvents($limit);
        return response()->json(['data' => $events]);
    }

    // Simple mock generator to produce a sample event for local testing
    public function mockGenerate(Request $request)
    {
        $sample = [
            'device_id' => 'sim_device_1',
            'device_type' => 'Hikvision Terminal',
            'user_id' => $request->input('user_id', 'u_'.rand(100,999)),
            'method' => $request->input('method', 'face'),
            'match_result' => 'success',
            'timestamp' => date('c'),
            'snapshot_url' => $request->input('snapshot_url', null),
        ];

        $event = $this->hikService->storeEvent($sample);
        return response()->json(['data' => $event]);
    }

    // Fetch a snapshot from a device (proxy). Returns base64 data URL.
    public function fetchSnapshot(Request $request)
    {
        $snapshotUrl = $request->input('snapshot_url');
        $deviceIp = $request->input('device_ip');
        $path = $request->input('path');

        if (!$snapshotUrl && !$deviceIp && !$path) {
            return response()->json(['error' => 'missing_parameters'], 400);
        }

        if (!$snapshotUrl) {
            // Build common ISAPI snapshot path if path provided
            $snapshotUrl = rtrim($deviceIp, '/') . '/' . ltrim($path, '/');
        }

        try {
            $username = $request->input('username') ?? env('HIKVISION_DEVICE_USER');
            $password = $request->input('password') ?? env('HIKVISION_DEVICE_PASS');

            $client = HttpClient::withOptions(['verify' => false]);
            if ($username && $password) {
                $client = $client->withBasicAuth($username, $password);
            }

            $resp = $client->get($snapshotUrl);
            if ($resp->failed()) {
                return response()->json(['error' => 'fetch_failed', 'status' => $resp->status()], 502);
            }

            $content = $resp->body();
            $mime = $resp->header('Content-Type') ?? 'image/jpeg';
            $base64 = base64_encode($content);
            $dataUrl = 'data:' . $mime . ';base64,' . $base64;

            return response()->json(['data_url' => $dataUrl]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'exception', 'message' => $e->getMessage()], 500);
        }
    }
}
