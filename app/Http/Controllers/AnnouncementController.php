<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Announcement;
use Illuminate\Support\Facades\Auth;

class AnnouncementController extends Controller
{
    // Show all announcements
    public function index()
    {
        $announcements = Announcement::with('user:id,name,email')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($announcements);
    }

    // Create a new announcement
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string',
        ]);

        $announcement = Announcement::create([
            'title' => $request->title,
            'message' => $request->message,
            'created_by' => Auth::id(),
            'is_active' => true,
        ]);

        return response()->json([
            'message' => 'Announcement created successfully!',
            'data' => $announcement
        ], 201);
    }

    // Show one announcement
    public function show($id)
    {
        $announcement = Announcement::with('user:id,name,email')->find($id);

        if (!$announcement) {
            return response()->json(['message' => 'Announcement not found'], 404);
        }

        return response()->json($announcement);
    }

    // Update
    public function update(Request $request, $id)
    {
        $announcement = Announcement::find($id);

        if (!$announcement) {
            return response()->json(['message' => 'Announcement not found'], 404);
        }

        $announcement->update($request->only(['title', 'message', 'is_active']));

        return response()->json([
            'message' => 'Announcement updated successfully!',
            'data' => $announcement
        ]);
    }

    // Delete
    public function destroy($id)
    {
        $announcement = Announcement::find($id);

        if (!$announcement) {
            return response()->json(['message' => 'Announcement not found'], 404);
        }

        $announcement->delete();

        return response()->json(['message' => 'Announcement deleted successfully!']);
    }
}