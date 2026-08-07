<?php

namespace App\Services;

use App\Models\AppNotification;
use App\Models\Order;
use App\Models\User;

class NotificationService
{
    public static function notifyOrderCreated(Order $order, User $creator): void
    {
        try {
            $message = "Pesanan baru {$order->order_number} dari {$order->customer_name} telah dibuat oleh {$creator->name} dan menunggu verifikasi pembayaran.";

            // Notify Admin & Owner
            AppNotification::create([
                'target_role' => 'admin',
                'title'       => "Pesanan Baru #{$order->order_number}",
                'message'     => $message,
                'type'        => 'ORDER_CREATED',
                'link'        => '/orders/verification',
            ]);

            AppNotification::create([
                'target_role' => 'owner',
                'title'       => "Pesanan Baru #{$order->order_number}",
                'message'     => $message,
                'type'        => 'ORDER_CREATED',
                'link'        => '/orders',
            ]);
        } catch (\Throwable $e) {
            // Ignore if notifications table not migrated yet
        }
    }

    public static function notifyOrderApproved(Order $order, User $verifier): void
    {
        try {
            // Notify Packing Staff
            AppNotification::create([
                'target_role' => 'packing',
                'title'       => "Siap Dikemas #{$order->order_number}",
                'message'     => "Pesanan #{$order->order_number} telah diverifikasi oleh {$verifier->name} dan siap untuk dikemas!",
                'type'        => 'ORDER_APPROVED',
                'link'        => '/packing',
            ]);

            // Notify Sales Creator
            if ($order->created_by) {
                AppNotification::create([
                    'user_id' => $order->created_by,
                    'title'   => "Pembayaran Diverifikasi #{$order->order_number}",
                    'message' => "Pesanan #{$order->order_number} Anda telah diverifikasi oleh {$verifier->name} dan berlanjut ke tahap packing.",
                    'type'    => 'ORDER_APPROVED',
                    'link'    => '/orders',
                ]);
            }
        } catch (\Throwable $e) {
            // Ignore if notifications table not migrated yet
        }
    }

    public static function notifyPackingCompleted(Order $order, User $packer): void
    {
        try {
            $message = "Foto packing pesanan #{$order->order_number} telah diunggah oleh {$packer->name}. Slips nota & resi siap dicetak.";

            // Notify Admin & Owner
            AppNotification::create([
                'target_role' => 'admin',
                'title'       => "Packing Selesai #{$order->order_number}",
                'message'     => $message,
                'type'        => 'PACKING_COMPLETED',
                'link'        => '/orders?status=PACKING_COMPLETED',
            ]);

            AppNotification::create([
                'target_role' => 'owner',
                'title'       => "Packing Selesai #{$order->order_number}",
                'message'     => $message,
                'type'        => 'PACKING_COMPLETED',
                'link'        => '/orders?status=PACKING_COMPLETED',
            ]);
        } catch (\Throwable $e) {
            // Ignore if notifications table not migrated yet
        }
    }

    public static function notifyShipmentCompleted(Order $order): void
    {
        try {
            $resiStr = $order->tracking_number ? " (Resi: {$order->tracking_number})" : '';

            // Notify Sales Creator
            if ($order->created_by) {
                AppNotification::create([
                    'user_id' => $order->created_by,
                    'title'   => "Resi Terinput & Selesai #{$order->order_number}",
                    'message' => "Nomor resi{$resiStr} pesanan #{$order->order_number} telah diinput. Pesanan berhasil diselesaikan!",
                    'type'    => 'SHIPMENT_COMPLETED',
                    'link'    => '/orders',
                ]);
            }

            // Notify Owner
            AppNotification::create([
                'target_role' => 'owner',
                'title'       => "Pesanan Selesai #{$order->order_number}",
                'message'     => "Pesanan #{$order->order_number} telah dikirimkan{$resiStr}. Transaksi selesai.",
                'type'        => 'SHIPMENT_COMPLETED',
                'link'        => '/reports',
            ]);
        } catch (\Throwable $e) {
            // Ignore if notifications table not migrated yet
        }
    }
}
