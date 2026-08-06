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

        // Sales can only view orders created by themselves or general list
        return $role === 'sales';
    }

    public function create(User $user): bool
    {
        $role = $user->role->value ?? $user->role;
        return in_array($role, ['sales', 'admin', 'owner']);
    }

    public function update(User $user, Order $order): bool
    {
        $role = $user->role->value ?? $user->role;
        if (in_array($role, ['owner', 'admin'])) {
            return true;
        }

        // Sales can ONLY edit their OWN orders while status is WAITING_PROCESS (IDOR Protection)
        $statusStr = $order->status instanceof \BackedEnum ? $order->status->value : (string) $order->status;
        return $role === 'sales' && $order->created_by === $user->id && $statusStr === 'WAITING_PROCESS';
    }

    public function approve(User $user, Order $order): bool
    {
        $role = $user->role->value ?? $user->role;
        return in_array($role, ['admin', 'owner']);
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
}
