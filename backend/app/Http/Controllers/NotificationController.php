<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index()
    {
        $notifications = Notification::where("user_id", auth()->id())
            ->orderByDesc("created_at")
            ->get();

        return response()->json($notifications);
    }

    public function unreadCount()
    {
        $count = Notification::where("user_id", auth()->id())
            ->where("is_read", false)
            ->count();

        return response()->json(["unread" => $count]);
    }

    public function markRead($id)
    {
        $notification = Notification::where("user_id", auth()->id())
            ->where("id", $id)
            ->firstOrFail();

        $notification->update(["is_read" => true]);

        return response()->json(["message" => "Notification marked as read"]);
    }

    public function markAllRead()
    {
        Notification::where("user_id", auth()->id())
            ->update(["is_read" => true]);

        return response()->json(["message" => "All notifications marked as read"]);
    }

    public function send(Request $request, NotificationService $service)
    {
        // Middleware 'role:1,2' handles authorization
        
        $request->validate([
            "user_id" => "required|exists:users,id",
            "title"   => "required|string|max:255",
            "message" => "required|string",
            "type"    => "nullable|string",
            "link"    => "nullable|string",
        ]);

        $service->sendToUser(
            $request->user_id,
            $request->title,
            $request->message,
            $request->type,
            $request->link
        );

        return response()->json(["message" => "Notification sent successfully"]);
    }
}
