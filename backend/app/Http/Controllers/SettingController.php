<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Setting;
use Illuminate\Support\Facades\Storage;

class SettingController extends Controller
{
    // ==========================================
    // GET SETTINGS (Admin + SuperAdmin)
    // ==========================================
    public function index()
    {
        $user = auth()->user();

        // Only SuperAdmin (1) and Admin (2)
        if (!in_array($user->role_id, [1, 2])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json(Setting::first());
    }

    // ==========================================
    // UPDATE SETTINGS (SuperAdmin ONLY)
    // ==========================================
    public function update(Request $request)
    {
        $user = auth()->user();

        if ($user->role_id != 1) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'company_name' => 'sometimes|string|max:255',
            'company_email' => 'sometimes|email',
            'company_phone' => 'sometimes|string|max:20',
            'company_address' => 'sometimes|string|max:500',
        ]);

        $settings = Setting::first();

        if (!$settings) {
            $settings = Setting::create($request->all());
        } else {
            $settings->update($request->all());
        }

        return response()->json([
            'message' => 'Settings updated successfully',
            'settings' => $settings
        ]);
    }

    // ==========================================
    // UPLOAD LOGO (SuperAdmin ONLY)
    // ==========================================
    public function uploadLogo(Request $request)
    {
        $user = auth()->user();

        if ($user->role_id != 1) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'logo' => 'required|image|mimes:png,jpg,jpeg|max:2048',
        ]);

        $settings = Setting::first() ?? new Setting();

        // Delete old logo if exists
        if ($settings->logo && Storage::disk('public')->exists($settings->logo)) {
            Storage::disk('public')->delete($settings->logo);
        }

        // Store new logo
        $path = $request->file('logo')->store('logos', 'public');

        $settings->logo = $path;
        $settings->save();

        return response()->json([
            'message' => 'Logo uploaded successfully',
            'logo_url' => asset('storage/' . $path)
        ]);
    }
}