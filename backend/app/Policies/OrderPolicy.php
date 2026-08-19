<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role->value ?? $user->role, ['sales', 'admin', 'owner', 'packing']);
    }

    public function view(User $user, Order $order): bool
    {
        $role = $user->role->value ?? $user->role;
        if (in_array($role, ['owner', 'admin', 'packing'])) {
            return true;
        }

        // Sales may view only orders they created. Admin/Owner/Packing were
        // already allowed above and remain unchanged.
        return $role === 'sales' && $order->created_by === $user->id;
    }

    public function create(User $user): bool
    {
        $role = $user->role->value ?? $user->role;
        return in_array($role, ['sales', 'admin', 'owner']);
    }

    public function update(User $user, Order $order): bool
    {
        $role = $user->role->value ?? $user->role;
        // Sales are read-only after order creation. Generic PUT/PATCH updates
        // are reserved for Owner/Admin so status cannot be manipulated via API.
        return in_array($role, ['owner', 'admin']);
    }

    public function approve(User $user, Order $order): bool
    {
        $role = $user->role->value ?? $user->role;
        return in_array($role, ['admin', 'owner']);
    }

    public function managePackingQueue(User $user): bool
    {
        $role = $user->role->value ?? $user->role;
        return in_array($role, ['packing', 'admin', 'owner'], true);
    }

    public function uploadPacking(User $user, Order $order): bool
    {
        $role = $user->role->value ?? $user->role;
        return in_array($role, ['packing', 'admin', 'owner']);
    }

    public function completeShipment(User $user, Order $order): bool
    {
        $role = $user->role->value ?? $user->role;
        return in_array($role, ['admin', 'owner']);
    }

    public function delete(User $user, Order $order): bool
    {
        $role = $user->role->value ?? $user->role;
        return in_array($role, ['admin', 'owner']);
    }

    public function salesInform(User $user, Order $order): bool
    {
        $role = $user->role->value ?? $user->role;
        return in_array($role, ['owner', 'admin'], true) || ($role === 'sales' && $order->created_by === $user->id);
    }

    public function returnOrder(User $user, Order $order): bool
    {
        $role = $user->role->value ?? $user->role;
        return in_array($role, ['owner', 'admin'], true);
    }
}
