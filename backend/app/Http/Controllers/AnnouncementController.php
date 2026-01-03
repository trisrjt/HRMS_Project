<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Announcement;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class AnnouncementController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    // ==========================================
    // GET ALL ANNOUNCEMENTS (Everyone)
    // ==========================================
    public function index(Request $request)
    {
        $user = auth()->user();
        $query = Announcement::with('user:id,name,email')
            ->orderBy('created_at', 'desc');

        // Filter by Role for Employees (Role 4)
        if ($user->role_id == 4) {
            $query->whereJsonContains('target_audience', 'Employee')
                  ->where('status', 'Active');
            
            // Filter by Joining Date
            if ($user->employee && $user->employee->date_of_joining) {
                $query->whereDate('created_at', '>=', $user->employee->date_of_joining);
            }
        }
        // Filter by Role for HR (Role 3) - Optional, can see HR + Employee?
        elseif ($user->role_id == 3) {
             $query->where(function($q) {
                 $q->whereJsonContains('target_audience', 'HR')
                   ->orWhereJsonContains('target_audience', 'Employee');
             });
        }

        // Optional: Backend filtering
        if ($request->has('category') && $request->category) {
            $query->where('category', $request->category);
        }
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }
        if ($request->has('search') && $request->search) {
            $query->where(function($q) use ($request) {
                $q->where('title', 'like', "%{$request->search}%")
                  ->orWhere('message', 'like', "%{$request->search}%");
            });
        }

        // Pagination
        $announcements = $query->paginate(10);

        return response()->json($announcements);
    }

    // ==========================================
    // CREATE ANNOUNCEMENT (SuperAdmin, Admin, HR)
    // ==========================================
    public function store(Request $request)
    {
        $user = auth()->user();

        // Only SuperAdmin (1), Admin (2), HR (3)
        if (!in_array($user->role_id, [1, 2, 3])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'title'           => 'required|string|max:255',
            'message'         => 'required|string',
            'category'        => 'required|string',
            'target_audience' => 'required|array',
            'status'          => 'required|in:Active,Inactive',
            'attachment_url'  => 'nullable|string'
        ]);

        $announcement = Announcement::create([
            'title'           => $request->title,
            'message'         => $request->message,
            'category'        => $request->category,
            'target_audience' => $request->target_audience, // Casted to array in model
            'status'          => $request->status,
            'attachment_url'  => $request->attachment_url,
            'created_by'      => $user->id,
            'views_count'     => 0,
        ]);

        // Send Notifications if Active
        if ($request->status === 'Active') {
            $this->sendAnnouncementNotifications($announcement);
        }

        return response()->json([
            'message' => 'Announcement created successfully!',
            'data'    => $announcement
        ], 201);
    }

    // ==========================================
    // GET SINGLE ANNOUNCEMENT (Everyone)
    // ==========================================
    public function show($id)
    {
        $announcement = Announcement::with('user:id,name,email')->find($id);

        if (!$announcement) {
            return response()->json(['message' => 'Announcement not found'], 404);
        }

        return response()->json($announcement);
    }

    // ==========================================
    // UPDATE ANNOUNCEMENT
    // ==========================================
    public function update(Request $request, $id)
    {
        $user = auth()->user();

        if (!in_array($user->role_id, [1, 2, 3])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $announcement = Announcement::find($id);

        if (!$announcement) {
            return response()->json(['message' => 'Announcement not found'], 404);
        }

        if ($user->role_id == 3 && $announcement->created_by != $user->id) {
            return response()->json([
                'message' => 'HR cannot modify announcements created by Admin or SuperAdmin'
            ], 403);
        }

        $announcement->update($request->only([
            'title', 'message', 'category', 'target_audience', 'status', 'attachment_url'
        ]));

        return response()->json([
            'message' => 'Announcement updated successfully!',
            'data'    => $announcement
        ]);
    }

    // ==========================================
    // DELETE ANNOUNCEMENT
    // ==========================================
    public function destroy($id)
    {
        $user = auth()->user();

        if (!in_array($user->role_id, [1, 2, 3])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $announcement = Announcement::find($id);

        if (!$announcement) {
            return response()->json(['message' => 'Announcement not found'], 404);
        }

        if ($user->role_id == 3 && $announcement->created_by != $user->id) {
            return response()->json([
                'message' => 'HR cannot delete announcements created by Admin or SuperAdmin'
            ], 403);
        }

        $announcement->delete();

        return response()->json(['message' => 'Announcement deleted successfully!']);
    }

    // ==========================================
    // UPLOAD FILE
    // ==========================================
    public function uploadFile(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:pdf,doc,docx,png,jpg,jpeg|max:5120', // 5MB
        ]);

        if ($request->hasFile('file')) {
            $path = $request->file('file')->store('announcements', 'public');
            $url = asset('storage/' . $path);
            return response()->json(['url' => $url]);
        }

        return response()->json(['message' => 'File upload failed'], 400);
    }

    // ==========================================
    // TRACK VIEW
    // ==========================================
    public function trackView($id)
    {
        $announcement = Announcement::find($id);
        if ($announcement) {
            $announcement->increment('views_count');
            return response()->json(['message' => 'View tracked']);
        }
        return response()->json(['message' => 'Announcement not found'], 404);
    }

    // ==========================================
    // HELPER: SEND NOTIFICATIONS
    // ==========================================
    private function sendAnnouncementNotifications($announcement)
    {
        $targetRoles = [];
        $audience = $announcement->target_audience; // Array of strings: ["Employee", "HR"]

        // Map strings to Role IDs
        if (in_array('SuperAdmin', $audience)) $targetRoles[] = 1;
        if (in_array('Admin', $audience))      $targetRoles[] = 2;
        if (in_array('HR', $audience))         $targetRoles[] = 3;
        if (in_array('Employee', $audience))   $targetRoles[] = 4;

        if (!empty($targetRoles)) {
            $this->notificationService->sendToRoles(
                $targetRoles,
                "New Announcement: " . $announcement->title,
                "A new announcement has been posted: " . substr($announcement->message, 0, 50) . "...",
                "announcement",
                "/announcements" // Link for employees to view
            );
        }
    }
}