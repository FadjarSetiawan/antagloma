<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // Get notifications target to this specific user or to user's role
        $notifications = AppNotification::where(function ($query) use ($user) {
            $query->where('user_id', $user->id)
                  ->orWhere('target_role', $user->role);
        })
        ->orderBy('created_at', 'desc')
        ->limit(50)
        ->get();

        $unreadCount = $notifications->where('is_read', false)->count();

        // Add human time diff
        $data = $notifications->map(function ($notif) {
            return [
                'id'          => $notif->id,
                'title'       => $notif->title,
                'message'     => $notif->message,
                'type'        => $notif->type,
                'link'        => $notif->link,
                'is_read'     => $notif->is_read,
                'created_at'  => $notif->created_at->toISOString(),
                'time_ago'    => $notif->created_at->diffForHumans(),
            ];
        });

        return response()->json([
            'success'      => true,
            'unread_count' => $unreadCount,
            'data'         => $data,
        ]);
    }

    public function markAsRead(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        $notification = AppNotification::where('id', $id)
            ->where(function ($query) use ($user) {
                $query->where('user_id', $user->id)
                      ->orWhere('target_role', $user->role);
            })
            ->firstOrFail();

        $notification->update(['is_read' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Notifikasi ditandai telah dibaca.',
        ]);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = $request->user();

        AppNotification::where(function ($query) use ($user) {
            $query->where('user_id', $user->id)
                  ->orWhere('target_role', $user->role);
        })
        ->where('is_read', false)
        ->update(['is_read' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Semua notifikasi berhasil ditandai telah dibaca.',
        ]);
    }
}
