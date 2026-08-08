<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Carbon\Carbon;

class CommissionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $monthStr = $request->query('month', now()->format('Y-m')); // e.g. 2026-08

        $query = Order::with('items');

        // Filter by sales user if sales role
        if ($user && $user->role === 'sales') {
            $query->where('created_by', $user->id);
        }

        $orders = $query->orderBy('order_date', 'desc')->get();

        // Calculate commissions per order and monthly totals
        $monthlyTotalCommission = 0;
        $orderHistory = [];

        foreach ($orders as $order) {
            $plantTotal = 0;

            foreach ($order->items as $item) {
                $qty = (float) $item->quantity;
                $price = (float) $item->price;
                $plantTotal += ($qty * $price);
            }

            // Commission is 5% of Total Harga Tanaman (plantTotal).
            // It ONLY accrues when Admin has verified payment (status !== WAITING_PROCESS and status !== CANCELLED).
            $isVerified = !in_array($order->status, ['WAITING_PROCESS', 'CANCELLED']);
            $commission = $isVerified ? round($plantTotal * 0.05) : 0;

            $orderMonth = Carbon::parse($order->order_date)->format('Y-m');
            if ($orderMonth === $monthStr && $isVerified) {
                $monthlyTotalCommission += $commission;
            }

            $formattedDate = Carbon::parse($order->order_date)->locale('id')->translatedFormat('d F Y');

            $orderHistory[] = [
                'id'                 => $order->id,
                'order_number'       => $order->order_number,
                'customer_name'      => $order->customer_name,
                'date'               => $formattedDate,
                'raw_date'           => $order->order_date,
                'month_key'          => $orderMonth,
                'item_count'         => count($order->items),
                'plant_total'        => $plantTotal,
                'commission'         => $commission,
                'is_verified'        => $isVerified,
                'status'             => $isVerified ? 'Cair / Terverifikasi' : 'Menunggu Verifikasi Admin',
                'payment_status'     => $order->payment_status,
            ];
        }

        // Filter history list for requested month
        $filteredHistory = array_filter($orderHistory, function ($item) use ($monthStr) {
            return $item['month_key'] === $monthStr;
        });

        return response()->json([
            'success' => true,
            'data'    => [
                'month'              => $monthStr,
                'month_label'        => Carbon::parse($monthStr . '-01')->locale('id')->translatedFormat('F Y'),
                'monthly_commission' => $monthlyTotalCommission,
                'total_orders'       => count($filteredHistory),
                'history'            => array_values($filteredHistory),
                'all_history'        => array_values($orderHistory),
            ],
        ]);
    }
}
