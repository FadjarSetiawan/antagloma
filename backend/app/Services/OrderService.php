<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use App\Repositories\Contracts\OrderRepositoryInterface;
use App\Repositories\Eloquent\OrderRepository;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderService
{
    protected OrderRepositoryInterface $orderRepository;

    public function __construct(
        ?OrderRepositoryInterface $orderRepository = null
    ) {
        $this->orderRepository = $orderRepository ?? app(OrderRepository::class);
    }

    public function generateOrderNumber(string $dateString): string
    {
        $dateObj = Carbon::parse($dateString);
        $formattedDate = $dateObj->format('Ymd'); // YYYYMMDD
        $prefix = 'ORD-' . $formattedDate . '-';

        // Atomic row lock to prevent race conditions during order sequence generation
        $lastOrder = Order::where('order_number', 'like', $prefix . '%')
            ->lockForUpdate()
            ->orderBy('id', 'desc')
            ->first();

        if ($lastOrder) {
            $lastNum = (int) substr($lastOrder->order_number, -4);
            $sequence = str_pad($lastNum + 1, 4, '0', STR_PAD_LEFT);
        } else {
            $sequence = '0001';
        }

        return $prefix . $sequence;
    }

    public function previewNextOrderNumber(string $dateString): string
    {
        $dateObj = Carbon::parse($dateString);
        $formattedDate = $dateObj->format('Ymd');
        $prefix = 'ORD-' . $formattedDate . '-';
        $lastOrder = Order::whereDate('order_date', $dateObj->toDateString())
            ->where('order_number', 'like', $prefix . '%')
            ->orderByDesc('order_number')
            ->first();

        $nextSequence = $lastOrder ? ((int) substr($lastOrder->order_number, -4)) + 1 : 1;

        return $prefix . str_pad((string) $nextSequence, 4, '0', STR_PAD_LEFT);
    }

    public function createOrder(array $data, User $user): Order
    {
        return retry(3, fn () => DB::transaction(function () use ($data, $user) {
            $orderDate = $data['order_date'] ?? now()->toDateString();
            $orderNumber = $this->generateOrderNumber($orderDate);

            $proofPath = null;
            if (isset($data['payment_proof']) && $data['payment_proof'] instanceof \Illuminate\Http\UploadedFile) {
                // Secure file upload with UUID hash path
                $proofPath = $data['payment_proof']->store('payment_proofs', 'public');
            }

            $payload = [
                'order_number'        => $orderNumber,
                'order_date'          => $orderDate,
                'customer_name'       => strip_tags($data['customer_name']),
                'phone'               => strip_tags($data['phone']),
                'delivery_method'     => $data['delivery_method'],
                'province_id'         => $data['province_id'] ?? null,
                'province_name'       => $data['province_name'] ?? null,
                'regency_id'          => $data['regency_id'] ?? null,
                'regency_name'        => $data['regency_name'] ?? null,
                'district_id'         => $data['district_id'] ?? null,
                'district_name'       => $data['district_name'] ?? null,
                'full_address'        => strip_tags($data['full_address']),
                'notes'               => isset($data['notes']) ? strip_tags($data['notes']) : null,
                'status'              => OrderStatus::WAITING_PROCESS,
                'payment_method'      => $data['payment_method'],
                'bank_name'           => $data['payment_method'] === 'Transfer Bank' ? ($data['bank_name'] ?? null) : null,
                'buyer_shipping_cost' => in_array($data['delivery_method'], ['Kirim Paket', 'Packing Kayu'], true) ? ($data['buyer_shipping_cost'] ?? 0) : 0,
                'payment_proof_path'  => $proofPath,
                'payment_status'      => 'PAID',
                'created_by'          => $user->id,
            ];

            $order = $this->orderRepository->create($payload);

            // Create Order Items
            if (!empty($data['items']) && is_array($data['items'])) {
                foreach ($data['items'] as $item) {
                    $productName = $item['product_name'] ?? ($item['tree_name'] ?? 'Adenium');
                    OrderItem::create([
                        'order_id'       => $order->id,
                        'tree_code'      => $item['tree_code'] ?? null,
                        'tree_name'      => isset($item['tree_name']) ? strip_tags($item['tree_name']) : null,
                        'grade'          => $item['grade'] ?? null,
                        'product_name'   => strip_tags($productName),
                        'variant'        => $item['variant'] ?? ($item['grade'] ? 'Grade ' . $item['grade'] : null),
                        'quantity'       => max(1, (int) ($item['quantity'] ?? 1)),
                        'price'          => max(0, (float) ($item['price'] ?? 0)),
                        'standard_price' => max(0, (float) ($item['standard_price'] ?? 0)),
                        'discount'       => max(0, (float) ($item['discount'] ?? 0)),
                        'notes'          => isset($item['notes']) ? strip_tags($item['notes']) : null,
                    ]);
                }
            }

            AuditLogService::logSecurityEvent('ORDER_CREATED', $user, [
                'order_id'     => $order->id,
                'order_number' => $order->order_number,
            ]);

            // Trigger Notification to Admin & Owner
            NotificationService::notifyOrderCreated($order, $user);

            return $order->fresh(['creator', 'items']);
        }), 50, function (\Throwable $e) {
            return $e instanceof \Illuminate\Database\QueryException && $e->getCode() === '23000';
        });
    }

    public function approveOrder(Order $order, User $user): Order
    {
        return DB::transaction(function () use ($order, $user) {
            $lockedOrder = Order::where('id', $order->id)->lockForUpdate()->firstOrFail();

            $currentStatus = $lockedOrder->status instanceof \BackedEnum ? $lockedOrder->status->value : (string) $lockedOrder->status;
            if ($currentStatus !== OrderStatus::WAITING_PROCESS->value) {
                throw ValidationException::withMessages([
                    'status' => ['Pesanan tidak dapat disetujui karena status saat ini bukan WAITING_PROCESS.']
                ]);
            }

            $deliveryMethod = $lockedOrder->delivery_method instanceof \BackedEnum ? $lockedOrder->delivery_method->value : (string) $lockedOrder->delivery_method;
            $isDirectCompletion = in_array($deliveryMethod, ['Ambil di Tempat', 'Ambil Di Lokasi', 'Antar ke Rumah', 'Antar Ke Rumah'], true);
            $lockedOrder->update([
                'status'      => $isDirectCompletion ? OrderStatus::COMPLETED : OrderStatus::WAITING_PACKING,
                'verified_by' => $user->id,
                'verified_at' => now(),
            ]);

            AuditLogService::logSecurityEvent('ORDER_APPROVED', $user, [
                'order_id'     => $lockedOrder->id,
                'order_number' => $lockedOrder->order_number,
            ]);

            // Trigger Notification to Packing & Sales
            if ($isDirectCompletion) {
                $lockedOrder->update(['completed_at' => now()]);
            }
            NotificationService::notifyOrderApproved($lockedOrder, $user);

            return $lockedOrder->fresh(['creator', 'verifier', 'items', 'packingImages', 'packages']);
        });
    }

    public function completeShipment(Order $order, array $data): Order
    {
        return DB::transaction(function () use ($order, $data) {
            $lockedOrder = Order::where('id', $order->id)->lockForUpdate()->firstOrFail();

            $currentStatus = $lockedOrder->status instanceof \BackedEnum ? $lockedOrder->status->value : (string) $lockedOrder->status;
            if ($currentStatus !== OrderStatus::PACKING_COMPLETED->value) {
                throw ValidationException::withMessages([
                    'status' => ['Pengiriman tidak dapat diselesaikan karena status saat ini belum PACKING_COMPLETED.']
                ]);
            }

            $lockedOrder->update([
                'status'          => OrderStatus::COMPLETED,
                'shipping_cost'   => max(0, (float) ($data['shipping_cost'] ?? 0)),
                'tracking_number' => isset($data['tracking_number']) ? strip_tags($data['tracking_number']) : null,
                'shipped_at'      => now(),
                'completed_at'    => now(),
            ]);

            AuditLogService::logSecurityEvent('SHIPMENT_COMPLETED', auth()->user(), [
                'order_id'     => $lockedOrder->id,
                'order_number' => $lockedOrder->order_number,
            ]);

            // Trigger Notification to Sales & Owner
            NotificationService::notifyShipmentCompleted($lockedOrder);

            return $lockedOrder->fresh(['creator', 'verifier', 'items', 'packingImages']);
        });
    }

    public function updateOrder(Order $order, array $data): Order
    {
        return DB::transaction(function () use ($order, $data) {
            $order->update($data);
            AuditLogService::logSecurityEvent('ORDER_UPDATED', auth()->user(), ['order_id' => $order->id]);
            return $order->fresh(['creator', 'verifier', 'items', 'packingImages']);
        });
    }

    public function rejectOrder(Order $order, string $reason, User $verifier): Order
    {
        return DB::transaction(function () use ($order, $reason, $verifier) {
            $lockedOrder = Order::where('id', $order->id)->lockForUpdate()->firstOrFail();

            $lockedOrder->update([
                'status'           => OrderStatus::CANCELLED,
                'payment_status'   => 'REJECTED',
                'rejection_reason' => $reason,
                'verified_by'      => $verifier->id,
                'verified_at'      => now(),
            ]);

            AuditLogService::logSecurityEvent('ORDER_REJECTED', $verifier, [
                'order_id'         => $lockedOrder->id,
                'order_number'     => $lockedOrder->order_number,
                'rejection_reason' => $reason,
            ]);

            return $lockedOrder->fresh(['creator', 'verifier', 'items', 'packingImages']);
        });
    }

    public function deleteOrder(Order $order): bool
    {
        AuditLogService::logSecurityEvent('ORDER_DELETED', auth()->user(), [
            'order_id'     => $order->id,
            'order_number' => $order->order_number,
        ]);
        return $this->orderRepository->delete($order);
    }
}
