<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Announcement;
use Illuminate\Support\Facades\Auth;

class AnnouncementController extends Controller
{
    // ==========================================
    // GET ALL ANNOUNCEMENTS (Everyone)
    // ==========================================
    public function index()
    {
        $announcements = Announcement::with('user:id,name,email')
            ->orderBy('created_at', 'desc')
            ->get();

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
            'title'   => 'required|string|max:255',
            'message' => 'required|string',
        ]);

        $announcement = Announcement::create([
            'title'      => $request->title,
            'message'    => $request->message,
            'created_by' => $user->id,
            'is_active'  => true,
        ]);

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
    // SuperAdmin/Admin → can update any
    // HR → can update only self-created
    // ==========================================
    public function update(Request $request, $id)
    {
        $user = auth()->user();

        // Only SuperAdmin, Admin, HR allowed
        if (!in_array($user->role_id, [1, 2, 3])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $announcement = Announcement::find($id);

        if (!$announcement) {
            return response()->json(['message' => 'Announcement not found'], 404);
        }

        // ❗ HR cannot update Admin/SuperAdmin announcements
        if ($user->role_id == 3 && $announcement->created_by != $user->id) {
            return response()->json([
                'message' => 'HR cannot modify announcements created by Admin or SuperAdmin'
            ], 403);
        }

        $announcement->update($request->only(['title', 'message', 'is_active']));

        return response()->json([
            'message' => 'Announcement updated successfully!',
            'data'    => $announcement
        ]);
    }

    // ==========================================
    // DELETE ANNOUNCEMENT
    // SuperAdmin/Admin → can delete any
    // HR → can delete only self-created
    // ==========================================
    public function destroy($id)
    {
        $user = auth()->user();

        // Only SuperAdmin, Admin, HR allowed
        if (!in_array($user->role_id, [1, 2, 3])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $announcement = Announcement::find($id);

        if (!$announcement) {
            return response()->json(['message' => 'Announcement not found'], 404);
        }

        // ❗ HR cannot delete announcements created by Admin/SuperAdmin
        if ($user->role_id == 3 && $announcement->created_by != $user->id) {
            return response()->json([
                'message' => 'HR cannot delete announcements created by Admin or SuperAdmin'
            ], 403);
        }

        $announcement->delete();

        return response()->json(['message' => 'Announcement deleted successfully!']);
    }
}