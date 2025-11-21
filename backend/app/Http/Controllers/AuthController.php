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
        $validated = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string'
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user) {
            throw ValidationException::withMessages([
                'email' => ['User does not exist.']
            ]);
        }

        if (!Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'password' => ['Incorrect password.']
            ]);
        }

        if (!$user->is_active) {
            return response()->json(['message' => 'Account disabled'], 403);
        }

        // Remove old tokens
        $user->tokens()->delete();

        // Create new token
        $token = $user->createToken('api_token')->plainTextToken;

        return response()->json([
            'message'      => 'Login successful',
            'access_token' => $token,
            'token_type'   => 'Bearer',
            'user'         => [
                'id'          => $user->id,
                'name'        => $user->name,
                'email'       => $user->email,
                'role_id'     => $user->role_id,
                'department_id' => $user->department_id,
            ]
        ], 200);
    }

    // ==============================
    // Authenticated User Info
    // ==============================
    public function profile(Request $request)
    {
        return response()->json($request->user());
    }
}