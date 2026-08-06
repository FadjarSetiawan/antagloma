<?php

namespace App\Repositories\Eloquent;

use App\Models\Order;
use App\Repositories\Contracts\OrderRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class OrderRepository implements OrderRepositoryInterface
{
    public function getPaginatedOrders(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Order::with(['creator', 'verifier', 'items', 'packingImages.uploader']);

        if (!empty($filters['user_id'])) {
            $query->where('created_by', $filters['user_id']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                  ->orWhere('customer_name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        return $query->latest()->paginate($perPage);
    }

    public function findById(int $id): ?Order
    {
        return Order::with(['creator', 'verifier', 'items', 'packingImages.uploader'])->find($id);
    }

    public function create(array $data): Order
    {
        return Order::create($data);
    }

    public function update(Order $order, array $data): Order
    {
        $order->update($data);
        return $order->fresh(['creator', 'verifier', 'items', 'packingImages.uploader']);
    }

    public function delete(Order $order): bool
    {
        return $order->delete();
    }
}
