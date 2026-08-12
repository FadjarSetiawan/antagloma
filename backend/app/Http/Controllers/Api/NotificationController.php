<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Carbon\Carbon;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $role = $user->role ?? 'sales';

        try {
            // Fetch DB notifications if table exists
            $dbNotifications = collect();
            try {
                $dbNotifications = AppNotification::where(function ($query) use ($user, $role) {
                    $query->where('user_id', $user->id)
                          ->orWhere('target_role', $role);
                })
                ->orderBy('created_at', 'desc')
                ->limit(50)
                ->get();
            } catch (\Throwable $e) {
                // Ignore if DB table missing
            }

            $mapped = $dbNotifications->map(function ($notif) {
                return [
                    'id'          => $notif->id,
                    'title'       => $notif->title,
                    'message'     => $notif->message,
                    'type'        => $notif->type,
                    'link'        => $notif->link,
                    'is_read'     => (bool) $notif->is_read,
                    'created_at'  => $notif->created_at->toISOString(),
                    'time_ago'    => $notif->created_at->diffForHumans(),
                ];
            });

            $unreadCount = $mapped->where('is_read', false)->count();

            return response()->json([
                'success'      => true,
                'unread_count' => $unreadCount,
                'data'         => $mapped->all(),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success'      => true,
                'unread_count' => 0,
                'data'         => [],
            ]);
        }
    }

    public function markAsRead(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        try {
            $notification = AppNotification::where('id', $id)
                ->where(function ($query) use ($user) {
                    $query->where('user_id', $user->id)
                          ->orWhere('target_role', $user->role);
                })
                ->first();

            if ($notification) {
                $notification->update(['is_read' => true]);
            }
        } catch (\Throwable $e) {
            // Ignore if missing
        }

        return response()->json([
            'success' => true,
            'message' => 'Notifikasi ditandai telah dibaca.',
        ]);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = $request->user();

        try {
            AppNotification::where(function ($query) use ($user) {
                $query->where('user_id', $user->id)
                      ->orWhere('target_role', $user->role);
            })
            ->where('is_read', false)
            ->update(['is_read' => true]);
        } catch (\Throwable $e) {
            // Ignore if missing
        }

        return response()->json([
            'success' => true,
            'message' => 'Semua notifikasi berhasil ditandai telah dibaca.',
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        try {
            $notification = AppNotification::where('id', $id)
                ->where(function ($query) use ($user) {
                    $query->where('user_id', $user->id)
                          ->orWhere('target_role', $user->role);
                })
                ->first();

            if ($notification) {
                $notification->delete();
            }
        } catch (\Throwable $e) {
            // Ignore if missing
        }

        return response()->json([
            'success' => true,
            'message' => 'Notifikasi berhasil dihapus.',
        ]);
    }
}
