<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index()
{
    if (!in_array(auth()->user()->role_id, [1, 2])) {
        return response()->json(['message' => 'Unauthorized'], 403);
    }

    return User::orderByDesc('id')->get();
}


    public function store(Request $request)
    {
        if (!in_array(auth()->user()->role_id, [1, 2])) {
        return response()->json(['message' => 'Unauthorized'], 403);
    }
        $validated = $request->validate([
    }

    public function show($id)
    {
        return User::findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        if (!in_array(auth()->user()->role_id, [1, 2])) {
    return response()->json(['message' => 'Unauthorized'], 403);
}

        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name'   => 'sometimes|string|max:255',
            'email'  => 'sometimes|email|unique:users,email,' . $id,
            'role_id' => 'sometimes|exists:roles,id',
            'temp_password' => 'sometimes|string|min:4',
        ]);

        if (isset($validated['temp_password'])) {
            $validated['password'] = Hash::make($validated['temp_password']);
            $validated['temp_password'] = $validated['temp_password'];
        }

        $user->update($validated);

        return response()->json([
            'message' => 'User updated successfully',
            'user' => $user
        ]);
    }

    public function setTempPassword(Request $request, $id)
    {
        if (!in_array(auth()->user()->role_id, [1, 2])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'temp_password' => 'required|min:4'
        ]);

        $user = User::findOrFail($id);

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

    public function changePassword(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'new_password' => 'required|min:6'
        ]);

        $user = User::find($request->user_id);

        $user->password = Hash::make($request->new_password);
        $user->temp_password = null;
        $user->save();

        return response()->json([
            'message' => 'Password changed successfully'
        ]);
    }

    public function destroy($id)
    {
       if (!in_array(auth()->user()->role_id, [1, 2])) {
    return response()->json(['message' => 'Unauthorized'], 403);
}

        User::findOrFail($id)->delete();

        return response()->json(['message' => 'User deleted']);
    }
}