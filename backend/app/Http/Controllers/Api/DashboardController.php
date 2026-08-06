<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function metrics(Request $request): JsonResponse
    {
        $user = $request->user();
        $role = $user->role instanceof \BackedEnum ? $user->role->value : $user->role;

        $query = Order::query();

        if ($role === 'sales') {
            $query->where('created_by', $user->id);
        }

        $todayOrders = (clone $query)->whereDate('order_date', now()->toDateString())->count();
        $waitingProcess = (clone $query)->where('status', 'WAITING_PROCESS')->count();
        $waitingPacking = (clone $query)->where('status', 'WAITING_PACKING')->count();
        $completedOrders = (clone $query)->where('status', 'COMPLETED')->count();

        $recentActivities = (clone $query)->with(['creator', 'verifier', 'items'])
            ->latest()
            ->take(5)
            ->get();

        return response()->json([
            'success' => true,
            'data'    => [
                'today_orders'     => $todayOrders,
                'waiting_process'  => $waitingProcess,
                'waiting_packing'  => $waitingPacking,
                'completed_orders' => $completedOrders,
                'recent_activities'=> $recentActivities,
            ]
        ]);
    }
}
