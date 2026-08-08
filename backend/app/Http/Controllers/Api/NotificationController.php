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
            // 1. Fetch DB notifications if table exists
            $dbNotifications = collect();
            try {
                $dbNotifications = AppNotification::where(function ($query) use ($user, $role) {
                    $query->where('user_id', $user->id)
                          ->orWhere('target_role', $role);
                })
                ->orderBy('created_at', 'desc')
                ->limit(30)
                ->get();
            } catch (\Throwable $e) {
                // Ignore if DB table missing
            }

            // 2. Generate dynamic notifications from real Order activities across stages
            $dynamicNotifs = collect();

            $recentOrders = Order::with(['creator', 'items', 'packingImages'])
                ->orderBy('updated_at', 'desc')
                ->limit(25)
                ->get();

            foreach ($recentOrders as $order) {
                $orderNum = $order->order_number;
                $custName = $order->customer_name;
                $updatedAt = $order->updated_at ?? Carbon::now();
                $timeAgo = $updatedAt->diffForHumans();

                // Notification Event 1: New Order Created
                if ($order->status === 'WAITING_PROCESS') {
                    if ($role === 'admin' || $role === 'owner') {
                        $dynamicNotifs->push([
                            'id'         => 100000 + $order->id,
                            'title'      => "Pesanan Baru {$orderNum} Perlu Verifikasi",
                            'message'    => "Sales " . ($order->creator->name ?? 'Staff') . " telah membuat pesanan atas nama {$custName}. Silakan verifikasi pembayaran.",
                            'type'       => 'ORDER_CREATED',
                            'link'       => '/orders/verification',
                            'is_read'    => false,
                            'created_at' => $updatedAt->toISOString(),
                            'time_ago'   => $timeAgo,
                        ]);
                    } elseif ($role === 'sales' && $order->created_by === $user->id) {
                        $dynamicNotifs->push([
                            'id'         => 100000 + $order->id,
                            'title'      => "Pesanan {$orderNum} Berhasil Dibuat",
                            'message'    => "Pesanan atas nama {$custName} berhasil dibuat. Menunggu verifikasi pembayaran oleh Admin.",
                            'type'       => 'ORDER_CREATED',
                            'link'       => '/orders',
                            'is_read'    => true,
                            'created_at' => $updatedAt->toISOString(),
                            'time_ago'   => $timeAgo,
                        ]);
                    }
                }

                // Notification Event 2: Verified Payment (WAITING_PACKING)
                if ($order->status === 'WAITING_PACKING') {
                    if ($role === 'sales' && $order->created_by === $user->id) {
                        $dynamicNotifs->push([
                            'id'         => 200000 + $order->id,
                            'title'      => "Pembayaran Order {$orderNum} Terverifikasi",
                            'message'    => "Admin telah menyetujui pembayaran untuk pesanan {$custName}. Pesanan saat ini dalam antrean pengemasan.",
                            'type'       => 'ORDER_APPROVED',
                            'link'       => '/orders',
                            'is_read'    => false,
                            'created_at' => $updatedAt->toISOString(),
                            'time_ago'   => $timeAgo,
                        ]);
                    } elseif ($role === 'packing' || $role === 'admin' || $role === 'owner') {
                        $dynamicNotifs->push([
                            'id'         => 200000 + $order->id,
                            'title'      => "Dokumen & Antrean Packing {$orderNum}",
                            'message'    => "Pesanan {$custName} ({$order->items->count()} tanaman) terverifikasi dan siap dicetak dokumennya.",
                            'type'       => 'ORDER_APPROVED',
                            'link'       => '/documents/print',
                            'is_read'    => false,
                            'created_at' => $updatedAt->toISOString(),
                            'time_ago'   => $timeAgo,
                        ]);
                    }
                }

                // Notification Event 3: Packing Completed / Photo Uploaded (PACKING_COMPLETED)
                if ($order->status === 'PACKING_COMPLETED') {
                    if ($role === 'sales' && $order->created_by === $user->id) {
                        $dynamicNotifs->push([
                            'id'         => 300000 + $order->id,
                            'title'      => "Foto Packing Order {$orderNum} Siap",
                            'message'    => "Foto bukti pengemasan tanaman untuk pesanan {$custName} telah selesai diunggah oleh kebun.",
                            'type'       => 'PACKING_COMPLETED',
                            'link'       => '/orders',
                            'is_read'    => false,
                            'created_at' => $updatedAt->toISOString(),
                            'time_ago'   => $timeAgo,
                        ]);
                    } elseif ($role === 'admin' || $role === 'owner') {
                        $dynamicNotifs->push([
                            'id'         => 300000 + $order->id,
                            'title'      => "Foto Kemasan {$orderNum} Diunggah",
                            'message'    => "Pesanan {$custName} telah selesai difoto. Menunggu input nomor resi pengiriman.",
                            'type'       => 'PACKING_COMPLETED',
                            'link'       => '/dashboard',
                            'is_read'    => false,
                            'created_at' => $updatedAt->toISOString(),
                            'time_ago'   => $timeAgo,
                        ]);
                    }
                }

                // Notification Event 4: Shipped / Resi Issued (COMPLETED)
                if ($order->status === 'COMPLETED' || !empty($order->tracking_number)) {
                    $resi = $order->tracking_number ?? 'Resi Terbit';
                    $dynamicNotifs->push([
                        'id'         => 400000 + $order->id,
                        'title'      => "Resi Pengiriman {$orderNum} Diterbitkan",
                        'message'    => "Nomor resi {$resi} ({$order->delivery_method}) telah diinput. Pesanan {$custName} siap dikirim.",
                        'type'       => 'SHIPMENT_COMPLETED',
                        'link'       => '/orders',
                        'is_read'    => false,
                        'created_at' => $updatedAt->toISOString(),
                        'time_ago'   => $timeAgo,
                    ]);
                }
            }

            // Combine DB notifications with dynamic notifications
            $allNotifs = $dynamicNotifs;
            if ($dbNotifications->count() > 0) {
                $dbMapped = $dbNotifications->map(function ($notif) {
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
                $allNotifs = $allNotifs->merge($dbMapped);
            }

            // Remove duplicates by id and sort by created_at desc
            $uniqueNotifs = $allNotifs->unique('id')->sortByDesc('created_at')->values();
            $unreadCount = $uniqueNotifs->where('is_read', false)->count();

            return response()->json([
                'success'      => true,
                'unread_count' => $unreadCount,
                'data'         => $uniqueNotifs->all(),
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
}
