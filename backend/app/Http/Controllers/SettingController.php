<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Setting;

class SettingController extends Controller
{
    // 1️⃣ Get All Settings
    public function index()
    {
        return response()->json(Setting::all());
    }

    // 2️⃣ Update Settings (text values)
    public function update(Request $request)
    {
        foreach ($request->all() as $key => $value) {
            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }

        return response()->json(['message' => 'Settings updated']);
    }

    // 3️⃣ Upload Logo File
    public function uploadLogo(Request $request)
    {
        $request->validate([
            'logo' => 'required|image|max:2048',
        ]);

        $path = $request->file('logo')->store('logos', 'public');

        Setting::updateOrCreate(
            ['key' => 'logo_url'],
            ['value' => '/storage/' . $path]
        );

        return response()->json([
            'message' => 'Logo uploaded successfully',
            'logo_url' => '/storage/' . $path,
        ]);
    }
}