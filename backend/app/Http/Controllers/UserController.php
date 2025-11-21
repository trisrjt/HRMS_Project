<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index()
    {
        return User::orderByDesc('id')->get();
    }

    // ❗ This should only be used for Admin/SuperAdmin — not employees
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'   => ['required', 'string', 'max:255'],
            'email'  => ['required', 'email', 'unique:users,email'],
            'role_id' => ['required', 'exists:roles,id'],
            'temp_password' => ['required', 'string', 'min:4'],
        ]);

        $user = User::create([
            'name'  => $validated['name'],
            'email' => $validated['email'],
            'role_id' => $validated['role_id'],
            'password' => Hash::make($validated['temp_password']),          // hashed password
            'temp_password' => $validated['temp_password'],                 // raw temp password
        ]);

        return response()->json([
            'message' => 'User created successfully',
            'user'    => $user
        ], 201);
    }

    public function show($id)
    {
        return User::findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name'   => 'sometimes|string|max:255',
            'email'  => 'sometimes|email|unique:users,email,' . $id,
            'role_id' => 'sometimes|exists:roles,id',
            'temp_password' => 'sometimes|string|min:4',
        ]);

        if (isset($validated['temp_password'])) {
            $validated['password'] = Hash::make($validated['temp_password']);
            $validated['temp_password'] = $validated['temp_password']; // store raw
        }

        $user->update($validated);

        return response()->json([
            'message' => 'User updated successfully',
            'user' => $user
        ]);
    }

    // ⭐ IMPORTANT FEATURE — Admin/SuperAdmin sets employee temp password
    public function setTempPassword(Request $request, $id)
    {
        if (!in_array(auth()->user()->role_id, [1, 2])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'temp_password' => 'required|min:4'
        ]);

        $user = User::findOrFail($id);

        // Update temp password
        $user->temp_password = $request->temp_password;
        $user->password = Hash::make($request->temp_password);
        $user->save();

        return response()->json([
            'message' => 'Temporary password updated successfully',
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'temp_password' => $user->temp_password
            ]
        ]);
    }

    public function destroy($id)
    {
        User::findOrFail($id)->delete();

        return response()->json(['message' => 'User deleted']);
    }
}