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

        // Filter by status (completed, waiting packing, waiting process, or all non-cancelled)
        $orders = $query->orderBy('order_date', 'desc')->get();

        // Calculate commissions per order and monthly totals
        $monthlyTotalCommission = 0;
        $orderHistory = [];

        foreach ($orders as $order) {
            $plantTotal = 0;
            $totalDiscount = 0;

            foreach ($order->items as $item) {
                $qty = (float) $item->quantity;
                $price = (float) $item->price;
                $discount = (float) $item->discount;

                $plantTotal += ($qty * $price);
                $totalDiscount += ($qty * $discount);
            }

            $subtotal = max(0, $plantTotal - $totalDiscount);
            $commission = round($subtotal * 0.05);

            $orderMonth = Carbon::parse($order->order_date)->format('Y-m');
            if ($orderMonth === $monthStr) {
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
                'total_discount'     => $totalDiscount,
                'subtotal'           => $subtotal,
                'commission'         => $commission,
                'status'             => 'Sudah Dibayarkan', // Default disbursement badge
                'payment_status'     => $order->payment_status,
            ];
        }

        // Filter history list for requested month
        $filteredHistory = array_filter($orderHistory, function ($item) use ($monthStr) {
            return $item['month_key'] === $monthStr;
        });

        // Group history by date for summary view if needed
        return response()->json([
            'success' => true,
            'data'    => [
                'month'                  => $monthStr,
                'month_label'            => Carbon::parse($monthStr . '-01')->locale('id')->translatedFormat('F Y'),
                'monthly_commission'     => $monthlyTotalCommission,
                'total_orders'           => count($filteredHistory),
                'history'                => array_values($filteredHistory),
                'all_history'            => array_values($orderHistory),
            ],
        ]);
    }
}
