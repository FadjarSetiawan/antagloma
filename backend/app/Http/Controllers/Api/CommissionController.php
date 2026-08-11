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
        $role = $user?->role instanceof \BackedEnum ? $user->role->value : (string) ($user?->role ?? '');
        abort_unless(in_array($role, ['owner', 'sales'], true), 403);

        $query = Order::with(['items', 'creator']);

        // Filter by sales user if sales role
        if ($role === 'owner') {
            return response()->json(['success' => true, 'data' => \App\Models\User::where('role', 'sales')->orderBy('name')->get(['id', 'name', 'email', 'commission_rate'])]);
        }
        if ($role === 'sales') {
            $query->where('created_by', $user->id);
        }

        $orders = $query->orderBy('order_date', 'desc')->get();

        // Calculate commissions per order and monthly totals
        $monthlyTotalCommission = 0;
        $orderHistory = [];

        foreach ($orders as $order) {
            $plantTotal = 0;

            foreach ($order->items as $item) {
                // item.price is the total selling price for the item quantity.
                $plantTotal += (float) $item->price;
            }

            // Commission is 5% of Total Harga Tanaman (plantTotal).
            // It ONLY accrues when Admin has verified payment (status !== WAITING_PROCESS and status !== CANCELLED).
            $orderStatus = $order->status instanceof \BackedEnum ? $order->status->value : (string) $order->status;
            $isVerified = !in_array($orderStatus, ['WAITING_PROCESS', 'CANCELLED'], true);
            $rate = (float) ($order->creator?->commission_rate ?? 5);
            $commission = $isVerified ? round($plantTotal * $rate / 100) : 0;

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

    public function show(Request $request, int $salesId): JsonResponse
    {
        $user = $request->user(); $role = $user->role instanceof \BackedEnum ? $user->role->value : (string) $user->role;
        if ($role === 'sales' && $user->id !== $salesId) abort(403);
        if (!in_array($role, ['owner', 'sales'], true)) abort(403);
        $sales = \App\Models\User::where('id', $salesId)->where('role', 'sales')->firstOrFail();
        return response()->json(['success' => true, 'data' => $sales->only(['id', 'name', 'email', 'commission_rate'])]);
    }

    public function update(Request $request, int $salesId): JsonResponse
    {
        $role = $request->user()->role instanceof \BackedEnum ? $request->user()->role->value : (string) $request->user()->role;
        if ($role !== 'owner') abort(403);
        $data = $request->validate(['commission_rate' => ['required', 'numeric', 'min:0', 'max:100']]);
        $sales = \App\Models\User::where('id', $salesId)->where('role', 'sales')->firstOrFail(); $sales->update($data);
        return response()->json(['success' => true, 'data' => $sales->only(['id', 'name', 'email', 'commission_rate'])]);
    }
}
