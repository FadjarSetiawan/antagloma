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
        $role = $user??->role instanceof \BackedEnum ? $user->role->value : (string) ($user?->role ?? '');
        abort_unless(in_array($role, ['owner', 'sales'], true), 403);

        $query = Order::with(['items', 'creator']);

        // Filter by sales user if sales role
        if ($role === 'owner') {
            $salesList = \App\Models\User::where('role', 'sales')->orderBy('name')->get(['id', 'name', 'email', 'commission_rate']);
            
            // Map payouts for the current month
            $payouts = \App\Models\CommissionPayout::where('month', $monthStr)->get()->keyBy('sales_id');

            $mappedSales = $salesList->map(function ($s) use ($payouts) {
                $payout = $payouts->get($s->id);
                return [
                    'id' => $s->id,
                    'name' => $s->name,
                    'email' => $s->email,
                    'commission_rate' => $s->commission_rate,
                    'payout_status' => $payout ? 'PAID' : 'UNPAID',
                    'payout_proof_path' => $payout ? $payout->payment_proof_path : null,
                    'payout_date' => $payout ? $payout->created_at->toISOString() : null,
                ];
            });

            return response()->json(['success' => true, 'data' => $mappedSales]);
        }
        if ($role === 'sales') {
            $query->where('created_by', $user->id);
        }

        $orders = $query->orderBy('order_date', 'desc')->get();

        // Calculate commissions per order and monthly totals
        $monthlyTotalCommission = 0;
        $monthlyTotalPlantPrice = 0;
        $monthlyOrderCount = 0;

        $todayTotalCommission = 0;
        $todayTotalPlantPrice = 0;
        $todayOrderCount = 0;

        $orderHistory = [];

        // Check if there is a payout recorded for this sales and month
        $isPayoutPaid = \App\Models\CommissionPayout::where('sales_id', $user->id)
            ->where('month', $monthStr)
            ->exists();

        $todayDateStr = now()->format('Y-m-d');
        $rate = (float) ($user->commission_rate ?? 5);

        foreach ($orders as $order) {
            $plantTotal = 0;

            foreach ($order->items as $item) {
                // item.price is the total selling price for the item quantity.
                $plantTotal += (float) $item->price;
            }

            // Commission is calculated based on commission_rate.
            // It ONLY accrues when Admin has verified payment (status !== WAITING_PROCESS and status !== CANCELLED).
            $orderStatus = $order->status instanceof \BackedEnum ? $order->status->value : (string) $order->status;
            $isVerified = !in_array($orderStatus, ['WAITING_PROCESS', 'CANCELLED'], true);
            $commission = $isVerified ? round($plantTotal * $rate / 100) : 0;

            $orderMonth = Carbon::parse($order->order_date)->format('Y-m');
            $orderDate = Carbon::parse($order->order_date)->format('Y-m-d');

            if ($isVerified) {
                // Monthly accumulates
                if ($orderMonth === $monthStr) {
                    $monthlyTotalCommission += $commission;
                    $monthlyTotalPlantPrice += $plantTotal;
                    $monthlyOrderCount++;
                }

                // Today accumulates
                if ($orderDate === $todayDateStr) {
                    $todayTotalCommission += $commission;
                    $todayTotalPlantPrice += $plantTotal;
                    $todayOrderCount++;
                }
            }

            $formattedDate = Carbon::parse($order->order_date)->locale('id')->translatedFormat('d F Y');

            $orderHistory[] = [
                'id'                 => $order->id,
                'order_number'       => $order->order_number,
                'customer_name'      => $order->customer_name,
                'date'               => $formattedDate,
                'raw_date'           => $order->order_date,
                'month_key'          => $orderMonth,
                'date_key'           => $orderDate,
                'item_count'         => count($order->items),
                'plant_total'        => $plantTotal,
                'commission'         => $commission,
                'is_verified'        => $isVerified,
                'status'             => $isVerified ? 'Cair / Terverifikasi' : 'Menunggu Verifikasi Admin',
                'payment_status'     => $order->payment_status,
            ];
        }

        // Get details of payout if exists
        $payoutDetail = \App\Models\CommissionPayout::where('sales_id', $user->id)
            ->where('month', $monthStr)
            ->first();

        return response()->json([
            'success' => true,
            'data'    => [
                'month'                  => $monthStr,
                'month_label'            => Carbon::parse($monthStr . '-01')->locale('id')->translatedFormat('F Y'),
                'commission_rate'        => $rate,
                'monthly_commission'     => $monthlyTotalCommission,
                'monthly_plant_total'    => $monthlyTotalPlantPrice,
                'monthly_total_orders'   => $monthlyOrderCount,
                'today_commission'       => $todayTotalCommission,
                'today_plant_total'      => $todayTotalPlantPrice,
                'today_total_orders'     => $todayOrderCount,
                'payout_status'          => $isPayoutPaid ? 'PAID' : 'UNPAID',
                'payout_proof_path'      => $payoutDetail ? $payoutDetail->payment_proof_path : null,
                'all_history'            => array_values($orderHistory),
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

    public function getPayouts(Request $request): JsonResponse
    {
        $role = $request->user()->role instanceof \BackedEnum ? $request->user()->role->value : (string) $request->user()->role;
        if ($role !== 'owner') abort(403);

        $payouts = \App\Models\CommissionPayout::with('sales')->orderBy('created_at', 'desc')->get();
        return response()->json([
            'success' => true,
            'data' => $payouts
        ]);
    }

    public function recordPayout(Request $request): JsonResponse
    {
        $role = $request->user()->role instanceof \BackedEnum ? $request->user()->role->value : (string) $request->user()->role;
        if ($role !== 'owner') abort(403);

        $validated = $request->validate([
            'sales_id' => ['required', 'exists:users,id'],
            'month' => ['required', 'string', 'regex:/^\d{4}-\d{2}$/'],
            'amount' => ['required', 'numeric', 'min:0'],
            'payment_proof' => ['required', 'file', 'image', 'max:5120'], // Max 5MB image
            'notes' => ['nullable', 'string'],
        ]);

        // Prevent duplicate payout
        $exists = \App\Models\CommissionPayout::where('sales_id', $validated['sales_id'])
            ->where('month', $validated['month'])
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'Komisi untuk sales ini pada bulan tersebut sudah pernah dibayarkan.',
            ], 422);
        }

        $proofPath = null;
        if ($request->hasFile('payment_proof')) {
            $proofPath = $request->file('payment_proof')->store('commission_proofs', 'public');
        }

        $payout = \App\Models\CommissionPayout::create([
            'sales_id' => $validated['sales_id'],
            'month' => $validated['month'],
            'amount' => $validated['amount'],
            'payment_proof_path' => $proofPath,
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pembayaran komisi sales berhasil dicatat.',
            'data' => $payout
        ]);
    }
}
