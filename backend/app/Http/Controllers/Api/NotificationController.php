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
                    // Personal notifications: addressed directly to this user (user_id matches)
                    // Only shown if no target_role set (broadcast to user) OR target_role matches current user's role
                    $query->where(function ($q) use ($user, $role) {
                        $q->where('user_id', $user->id)
                          ->where(function ($qq) use ($role) {
                              $qq->whereNull('target_role')
                                 ->orWhere('target_role', $role);
                          });
                    })
                    // Role-broadcast notifications: sent to this role with no specific user
                    ->orWhere(function ($q) use ($role) {
                        $q->where('target_role', $role)
                          ->whereNull('user_id');
                    });
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
            $role = $user->role instanceof \BackedEnum ? $user->role->value : (string) $user->role;
            $notification = AppNotification::where('id', $id)
                ->where(function ($query) use ($user, $role) {
                    $query->where(function ($q) use ($user, $role) {
                        $q->where('user_id', $user->id)
                          ->where(function ($qq) use ($role) {
                              $qq->whereNull('target_role')->orWhere('target_role', $role);
                          });
                    })
                    ->orWhere(function ($q) use ($role) {
                        $q->where('target_role', $role)->whereNull('user_id');
                    });
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
            $role = $user->role instanceof \BackedEnum ? $user->role->value : (string) $user->role;
            AppNotification::where(function ($query) use ($user, $role) {
                $query->where(function ($q) use ($user, $role) {
                    $q->where('user_id', $user->id)
                      ->where(function ($qq) use ($role) {
                          $qq->whereNull('target_role')->orWhere('target_role', $role);
                      });
                })
                ->orWhere(function ($q) use ($role) {
                    $q->where('target_role', $role)->whereNull('user_id');
                });
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
            $role = $user->role instanceof \BackedEnum ? $user->role->value : (string) $user->role;
            $notification = AppNotification::where('id', $id)
                ->where(function ($query) use ($user, $role) {
                    $query->where(function ($q) use ($user, $role) {
                        $q->where('user_id', $user->id)
                          ->where(function ($qq) use ($role) {
                              $qq->whereNull('target_role')->orWhere('target_role', $role);
                          });
                    })
                    ->orWhere(function ($q) use ($role) {
                        $q->where('target_role', $role)->whereNull('user_id');
                    });
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
