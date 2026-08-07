<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    protected function authorizeOwnerOrAdmin(Request $request): void
    {
        $role = $request->user()->role ?? '';
        if ($role !== 'owner' && $role !== 'admin') {
            throw ValidationException::withMessages([
                'authorization' => ['Akses ditolak. Hanya Owner dan Admin yang memiliki wewenang mengelola akun user.']
            ]);
        }
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorizeOwnerOrAdmin($request);

        $users = User::orderBy('created_at', 'desc')->get()->map(function ($u) {
            return [
                'id'         => $u->id,
                'name'       => $u->name,
                'email'      => $u->email,
                'role'       => $u->role,
                'created_at' => $u->created_at ? $u->created_at->toISOString() : now()->toISOString(),
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => $users,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorizeOwnerOrAdmin($request);

        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'role'     => ['required', 'string', Rule::in(['owner', 'admin', 'sales', 'packing'])],
        ]);

        $user = User::create([
            'name'     => strip_tags($validated['name']),
            'email'    => strtolower(trim($validated['email'])),
            'password' => Hash::make($validated['password']),
            'role'     => $validated['role'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Akun user baru berhasil dibuat.',
            'data'    => [
                'id'         => $user->id,
                'name'       => $user->name,
                'email'      => $user->email,
                'role'       => $user->role,
                'created_at' => $user->created_at ? $user->created_at->toISOString() : now()->toISOString(),
            ],
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $this->authorizeOwnerOrAdmin($request);

        $targetUser = User::findOrFail($id);

        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($targetUser->id)],
            'password' => ['nullable', 'string', 'min:6'],
            'role'     => ['required', 'string', Rule::in(['owner', 'admin', 'sales', 'packing'])],
        ]);

        $payload = [
            'name'  => strip_tags($validated['name']),
            'email' => strtolower(trim($validated['email'])),
            'role'  => $validated['role'],
        ];

        if (!empty($validated['password'])) {
            $payload['password'] = Hash::make($validated['password']);
        }

        $targetUser->update($payload);

        return response()->json([
            'success' => true,
            'message' => 'Data akun user berhasil diperbarui.',
            'data'    => [
                'id'         => $targetUser->id,
                'name'       => $targetUser->name,
                'email'      => $targetUser->email,
                'role'       => $targetUser->role,
                'created_at' => $targetUser->created_at ? $targetUser->created_at->toISOString() : now()->toISOString(),
            ],
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->authorizeOwnerOrAdmin($request);

        $targetUser = User::findOrFail($id);

        if ($targetUser->id === $request->user()->id) {
            throw ValidationException::withMessages([
                'user' => ['Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif digunakan.']
            ]);
        }

        $targetUser->delete();

        return response()->json([
            'success' => true,
            'message' => 'Akun user berhasil dihapus dari sistem.',
        ]);
    }
}
