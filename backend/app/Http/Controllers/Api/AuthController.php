<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email'    => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $cleanEmail = strtolower(trim($credentials['email']));
        $user = User::whereRaw('LOWER(TRIM(email)) = ?', [$cleanEmail])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Kredensial login tidak valid.'
            ], 401);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil.',
            'data'    => [
                'user'  => new UserResource($user),
                'token' => $token,
            ]
        ]);
    }

    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'role'     => ['required', 'string', Rule::in(['admin', 'sales'])],
        ]);

        $user = User::create([
            'name'     => strip_tags($validated['name']),
            'email'    => strtolower(trim($validated['email'])),
            'password' => Hash::make($validated['password']),
            'role'     => $validated['role'],
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Pendaftaran akun berhasil.',
            'data'    => [
                'user'  => new UserResource($user),
                'token' => $token,
            ]
        ], 201);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => new UserResource($request->user()),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil.',
        ]);
    }
}
