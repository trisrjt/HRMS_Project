<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    // ==============================
    // User Registration (Admin / Super Admin)
    // ==============================
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'email'       => 'required|email|unique:users,email',
            'password'    => 'required|string|min:4',
            'role_id'     => 'required|exists:roles,id', 
            'department_id' => 'nullable|exists:departments,id',
        ]);

        $user = User::create([
            'name'        => $validated['name'],
            'email'       => $validated['email'],
            'password'    => Hash::make($validated['password']),
            'role_id'     => $validated['role_id'],        // <-- Role saved here
            'department_id' => $validated['department_id'] ?? null,
            'is_active'   => true,
        ]);

        return response()->json([
            'message' => 'User registered successfully',
            'user'    => $user
        ], 201);
    }

    // ==============================
    // Employee Temp User Creation (HR)
    // ==============================
    public function createEmployeeUser(Request $request)
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:4',
        ]);

        // HR creates employee user → role_id = 3 (Employee)
        $user = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']), 
            'role_id'  => 3, // Employee
            'is_active'=> true,
        ]);

        return response()->json([
            'message' => 'Employee temp account created',
            'user'    => $user
        ], 201);
    }

    // ==============================
    // User Login
    // ==============================
    public function login(Request $request)
{
    $request->validate([
        'email' => 'required|email',
        'password' => 'required'
    ]);

    $user = User::where('email', $request->email)->first();

    if (!$user || !Hash::check($request->password, $user->password)) {
        return response()->json(['message' => 'Invalid credentials'], 401);
    }

    // Create API token
    $token = $user->createToken('auth_token')->plainTextToken;

    // FORCE PASSWORD CHANGE FOR EMPLOYEE IF TEMP PASSWORD EXISTS
    if ($user->role_id == 4 && $user->temp_password !== null) {
        return response()->json([
            'message' => 'Password change required',
            'force_password_change' => true,
            'user_id' => $user->id,
            'token' => $token
        ], 200);
    }

    return response()->json([
        'message' => 'Login successful',
        'force_password_change' => false,
        'token' => $token,
        'user' => $user
    ], 200);
}

    // ==============================
    // Authenticated User Info
    // ==============================
    public function profile(Request $request)
    {
        return response()->json($request->user()->load(['employee', 'role']));
    }
}