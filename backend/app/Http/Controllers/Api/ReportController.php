<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $user = $request->user();
        $role = $user->role instanceof \BackedEnum ? $user->role->value : $user->role;
        if ($role !== 'owner') {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $totalOrders = Order::count();
        $monthlyOrders = Order::whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();
        $completedOrders = Order::where('status', 'selesai')->count();

        return response()->json([
            'success' => true,
            'data'    => [
                'total_orders'     => $totalOrders,
                'monthly_orders'   => $monthlyOrders,
                'completed_orders' => $completedOrders,
            ]
        ]);
    }
}
