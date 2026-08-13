<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CommissionPayout;
use App\Models\CommissionPayoutOrder;
use App\Models\Order;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommissionController extends Controller
{
    // ─── Helper: normalize BackedEnum role to string ───────────────────────────
    private static function roleStr($user): string
    {
        return $user?->role instanceof \BackedEnum
            ? $user->role->value
            : (string) ($user?->role ?? '');
    }

    // ─── Helper: compute plant total + commission for a set of orders ──────────
    private static function calcOrders(iterable $orders, float $rate): array
    {
        $plantTotal  = 0;
        $commission  = 0;
        $orderCount  = 0;
        $items       = [];

        foreach ($orders as $order) {
            $orderPlant = 0;
            foreach ($order->items as $item) {
                $orderPlant += (float) $item->price;
            }

            $orderStatus  = $order->status instanceof \BackedEnum ? $order->status->value : (string) $order->status;
            $isVerified   = !in_array($orderStatus, ['WAITING_PROCESS', 'CANCELLED'], true);
            $orderCommission = $isVerified ? round($orderPlant * $rate / 100) : 0;

            $plantTotal += $orderPlant;
            $commission += $orderCommission;
            if ($isVerified) $orderCount++;

            $items[] = [
                'id'           => $order->id,
                'order_number' => $order->order_number,
                'customer_name'=> $order->customer_name,
                'date'         => Carbon::parse($order->order_date)->locale('id')->translatedFormat('d F Y'),
                'raw_date'     => $order->order_date,
                'plant_total'  => $orderPlant,
                'commission'   => $orderCommission,
                'is_verified'  => $isVerified,
                'item_count'   => count($order->items),
            ];
        }

        return compact('plantTotal', 'commission', 'orderCount', 'items');
    }

    // ──────────────────────────────────────────────────────────────────────────
    // GET /commissions
    // Owner  → list sales + pending commission per sales
    // Sales  → pending orders + payout history
    // ──────────────────────────────────────────────────────────────────────────
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $role = self::roleStr($user);
        abort_unless(in_array($role, ['owner', 'sales'], true), 403);

        // ── OWNER VIEW ────────────────────────────────────────────────────────
        if ($role === 'owner') {
            $salesList = User::where('role', 'sales')->orderBy('name')->get(['id', 'name', 'email', 'commission_rate']);

            $mapped = $salesList->map(function ($s) {
                $rate = (float) ($s->commission_rate ?? 5);

                // Orders already covered by any payout
                $paidOrderIds = CommissionPayoutOrder::whereHas('payout', fn($q) => $q->where('sales_id', $s->id))
                    ->pluck('order_id')->toArray();

                // Pending = completed orders NOT yet covered
                $pendingOrders = Order::with('items')
                    ->where('created_by', $s->id)
                    ->whereNotIn('id', $paidOrderIds ?: [0])
                    ->whereNotIn('status', ['WAITING_PROCESS', 'CANCELLED'])
                    ->get();

                $pendingCalc = self::calcOrders($pendingOrders, $rate);

                // Last payout info
                $lastPayout = CommissionPayout::where('sales_id', $s->id)
                    ->orderBy('created_at', 'desc')
                    ->first();

                return [
                    'id'                    => $s->id,
                    'name'                  => $s->name,
                    'email'                 => $s->email,
                    'commission_rate'       => $rate,
                    'pending_commission'    => $pendingCalc['commission'],
                    'pending_plant_total'   => $pendingCalc['plantTotal'],
                    'pending_order_count'   => $pendingCalc['orderCount'],
                    'last_payout_date'      => $lastPayout ? $lastPayout->created_at->toISOString() : null,
                    'last_payout_period'    => $lastPayout ? [
                        'start' => $lastPayout->period_start?->format('Y-m-d'),
                        'end'   => $lastPayout->period_end?->format('Y-m-d'),
                        'label' => $lastPayout->period_start && $lastPayout->period_end
                            ? Carbon::parse($lastPayout->period_start)->locale('id')->translatedFormat('d M Y')
                              . ' – '
                              . Carbon::parse($lastPayout->period_end)->locale('id')->translatedFormat('d M Y')
                            : ($lastPayout->month ?? '-'),
                    ] : null,
                ];
            });

            return response()->json(['success' => true, 'data' => $mapped]);
        }

        // ── SALES VIEW ───────────────────────────────────────────────────────
        $rate = (float) ($user->commission_rate ?? 5);

        $dateFilter  = $request->query('date');   // YYYY-MM-DD
        $monthFilter = $request->query('month');  // 1 - 12 or MM
        $yearFilter  = $request->query('year');   // YYYY

        // IDs of orders already in any payout for this sales
        $paidOrderIds = CommissionPayoutOrder::whereHas('payout', fn($q) => $q->where('sales_id', $user->id))
            ->pluck('order_id')->toArray();

        // Query orders of this sales user with date/month/year filter
        $query = Order::with('items')
            ->where('created_by', $user->id);

        if (!empty($dateFilter)) {
            $query->whereDate('order_date', $dateFilter);
        } else {
            if (!empty($monthFilter)) {
                $query->whereMonth('order_date', (int) $monthFilter);
            }
            if (!empty($yearFilter)) {
                $query->whereYear('order_date', (int) $yearFilter);
            }
        }

        $allOrders = $query->orderBy('order_date', 'desc')->get();

        $summary = [
            'waiting_verification' => 0, // WAITING_PROCESS
            'verified'             => 0, // WAITING_PACKING, PACKING_COMPLETED, COMPLETED (not yet paid)
            'paid'                 => 0, // Paid via payout
            'rejected'             => 0, // CANCELLED
        ];

        $orderHistory = [];

        foreach ($allOrders as $order) {
            $plantTotal = 0;
            foreach ($order->items as $item) {
                $plantTotal += (float) $item->price;
            }

            $statusVal = $order->status instanceof \BackedEnum ? $order->status->value : (string) $order->status;
            $isPaid = in_array($order->id, $paidOrderIds, true);

            $orderCommission = 0;
            $statusLabel = '';
            $statusKey = '';

            if ($statusVal === 'CANCELLED') {
                $statusKey = 'rejected';
                $statusLabel = 'Pembayaran ditolak';
                $orderCommission = round($plantTotal * $rate / 100);
            } elseif ($isPaid) {
                $statusKey = 'paid';
                $statusLabel = 'Sudah dibayarkan';
                $orderCommission = round($plantTotal * $rate / 100);
            } elseif ($statusVal === 'WAITING_PROCESS') {
                $statusKey = 'waiting_verification';
                $statusLabel = 'Menunggu Verifikasi';
            } else {
                // WAITING_PACKING, PACKING_COMPLETED, COMPLETED (unpaid)
                $statusKey = 'verified';
                $statusLabel = 'Terverifikasi';
                $orderCommission = round($plantTotal * $rate / 100);
            }

            if ($statusKey !== 'rejected') {
                $summary[$statusKey] += $orderCommission;
            } else {
                $summary['rejected'] += $orderCommission;
            }

            $deliveryMethodVal = $order->delivery_method instanceof \BackedEnum
                ? $order->delivery_method->value
                : (string) ($order->delivery_method ?? '');

            $orderHistory[] = [
                'id'              => $order->id,
                'order_number'    => $order->order_number,
                'customer_name'   => $order->customer_name,
                'delivery_method' => $deliveryMethodVal,
                'date'            => Carbon::parse($order->order_date)->locale('id')->translatedFormat('d M Y'),
                'raw_date'        => $order->order_date,
                'plant_total'     => $plantTotal,
                'commission'      => $orderCommission,
                'status_key'      => $statusKey,
                'status_label'    => $statusLabel,
                'is_paid'         => $isPaid,
            ];
        }

        // Payout history — all payouts for this sales, ordered newest first
        $payouts = CommissionPayout::with(['orders.items'])
            ->where('sales_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        $payoutHistory = $payouts->map(function ($payout) use ($rate) {
            $calc = self::calcOrders($payout->orders, $rate);

            $periodLabel = ($payout->period_start && $payout->period_end)
                ? Carbon::parse($payout->period_start)->locale('id')->translatedFormat('d M Y')
                  . ' – '
                  . Carbon::parse($payout->period_end)->locale('id')->translatedFormat('d M Y')
                : ($payout->month ?? '-');

            return [
                'payout_id'          => $payout->id,
                'period_label'       => $periodLabel,
                'period_start'       => $payout->period_start?->format('Y-m-d'),
                'period_end'         => $payout->period_end?->format('Y-m-d'),
                'amount'             => (float) $payout->amount,
                'plant_total'        => $calc['plantTotal'],
                'commission'         => $calc['commission'],
                'order_count'        => $calc['orderCount'],
                'payment_proof_path' => $payout->payment_proof_path,
                'paid_at'            => $payout->created_at->toISOString(),
                'notes'              => $payout->notes,
                'orders'             => $calc['items'],
            ];
        });

        // Total verified plant total & count for top banner
        $verifiedOrders = $allOrders->filter(function ($o) {
            $st = $o->status instanceof \BackedEnum ? $o->status->value : (string) $o->status;
            return !in_array($st, ['WAITING_PROCESS', 'CANCELLED'], true);
        });

        $totalPlantTotal = 0;
        foreach ($verifiedOrders as $vo) {
            foreach ($vo->items as $item) {
                $totalPlantTotal += (float) $item->price;
            }
        }

        $totalCommissionThisMonth = round($totalPlantTotal * $rate / 100);

        return response()->json([
            'success' => true,
            'data'    => [
                'commission_rate'              => $rate,
                'total_commission_this_month'  => $totalCommissionThisMonth,
                'total_plant_total'            => $totalPlantTotal,
                'total_orders_count'           => $verifiedOrders->count(),
                'summary'                      => $summary,
                'history'                      => $orderHistory,
                'payout_history'               => $payoutHistory->values()->all(),
            ],
        ]);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // GET /commissions/preview-orders?sales_id=&period_start=&period_end=
    // Owner: preview which orders will be covered + auto-calculated amount
    // ──────────────────────────────────────────────────────────────────────────
    public function previewOrders(Request $request): JsonResponse
    {
        $role = self::roleStr($request->user());
        abort_unless($role === 'owner', 403);

        $validated = $request->validate([
            'sales_id'     => ['required', 'exists:users,id'],
            'period_start' => ['required', 'date'],
            'period_end'   => ['required', 'date', 'gte:period_start'],
        ]);

        $sales = User::findOrFail($validated['sales_id']);
        $rate  = (float) ($sales->commission_rate ?? 5);

        $paidOrderIds = CommissionPayoutOrder::whereHas('payout', fn($q) => $q->where('sales_id', $sales->id))
            ->pluck('order_id')->toArray();

        $orders = Order::with('items')
            ->where('created_by', $sales->id)
            ->whereNotIn('id', $paidOrderIds ?: [0])
            ->whereNotIn('status', ['WAITING_PROCESS', 'CANCELLED'])
            ->whereDate('order_date', '>=', $validated['period_start'])
            ->whereDate('order_date', '<=', $validated['period_end'])
            ->orderBy('order_date', 'asc')
            ->get();

        $calc = self::calcOrders($orders, $rate);

        return response()->json([
            'success' => true,
            'data'    => [
                'order_count'    => $calc['orderCount'],
                'plant_total'    => $calc['plantTotal'],
                'commission'     => $calc['commission'],
                'commission_rate'=> $rate,
                'orders'         => $calc['items'],
            ],
        ]);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // GET /commissions/{salesId}  (owner detail view)
    // ──────────────────────────────────────────────────────────────────────────
    public function show(Request $request, int $salesId): JsonResponse
    {
        $user = $request->user();
        $role = self::roleStr($user);
        if ($role === 'sales' && $user->id !== $salesId) abort(403);
        if (!in_array($role, ['owner', 'sales'], true)) abort(403);

        $sales = User::where('id', $salesId)->where('role', 'sales')->firstOrFail();
        return response()->json(['success' => true, 'data' => $sales->only(['id', 'name', 'email', 'commission_rate'])]);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // PUT /commissions/{salesId}  update commission_rate
    // ──────────────────────────────────────────────────────────────────────────
    public function update(Request $request, int $salesId): JsonResponse
    {
        $role = self::roleStr($request->user());
        if ($role !== 'owner') abort(403);

        $data  = $request->validate(['commission_rate' => ['required', 'numeric', 'min:0', 'max:100']]);
        $sales = User::where('id', $salesId)->where('role', 'sales')->firstOrFail();
        $sales->update($data);

        return response()->json(['success' => true, 'data' => $sales->only(['id', 'name', 'email', 'commission_rate'])]);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // POST /commissions/payout  record a new commission payment
    // ──────────────────────────────────────────────────────────────────────────
    public function recordPayout(Request $request): JsonResponse
    {
        $role = self::roleStr($request->user());
        if ($role !== 'owner') abort(403);

        $validated = $request->validate([
            'sales_id'       => ['required', 'exists:users,id'],
            'period_start'   => ['required', 'date'],
            'period_end'     => ['required', 'date', 'gte:period_start'],
            'amount'         => ['required', 'numeric', 'min:0'],
            'payment_proof'  => ['required', 'file', 'image', 'max:5120'],
            'notes'          => ['nullable', 'string'],
        ]);

        $sales = User::findOrFail($validated['sales_id']);
        $rate  = (float) ($sales->commission_rate ?? 5);

        // Determine which orders fall in this period and are not yet paid
        $paidOrderIds = CommissionPayoutOrder::whereHas('payout', fn($q) => $q->where('sales_id', $sales->id))
            ->pluck('order_id')->toArray();

        $ordersToCover = Order::with('items')
            ->where('created_by', $sales->id)
            ->whereNotIn('id', $paidOrderIds ?: [0])
            ->whereNotIn('status', ['WAITING_PROCESS', 'CANCELLED'])
            ->whereDate('order_date', '>=', $validated['period_start'])
            ->whereDate('order_date', '<=', $validated['period_end'])
            ->get();

        if ($ordersToCover->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada pesanan selesai yang belum dibayar dalam rentang tanggal tersebut.',
            ], 422);
        }

        // Store proof file
        $proofPath = $request->file('payment_proof')->store('commission_proofs', 'public');

        // Create payout record
        $payout = CommissionPayout::create([
            'sales_id'           => $sales->id,
            'month'              => Carbon::parse($validated['period_start'])->format('Y-m'), // backward compat
            'period_start'       => $validated['period_start'],
            'period_end'         => $validated['period_end'],
            'amount'             => $validated['amount'],
            'payment_proof_path' => $proofPath,
            'notes'              => $validated['notes'] ?? null,
        ]);

        // Link orders to this payout via pivot
        $pivotData = $ordersToCover->pluck('id')->map(fn($id) => [
            'payout_id'  => $payout->id,
            'order_id'   => $id,
            'created_at' => now(),
            'updated_at' => now(),
        ])->toArray();

        CommissionPayoutOrder::insert($pivotData);

        $calc = self::calcOrders($ordersToCover, $rate);

        return response()->json([
            'success' => true,
            'message' => "Pembayaran komisi untuk {$ordersToCover->count()} pesanan berhasil dicatat.",
            'data'    => [
                'payout_id'    => $payout->id,
                'period_start' => $validated['period_start'],
                'period_end'   => $validated['period_end'],
                'order_count'  => $calc['orderCount'],
                'plant_total'  => $calc['plantTotal'],
                'commission'   => $calc['commission'],
                'amount_paid'  => (float) $validated['amount'],
            ],
        ]);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // GET /commissions/payouts  — list all payout records (owner only)
    // ──────────────────────────────────────────────────────────────────────────
    public function getPayouts(Request $request): JsonResponse
    {
        $role = self::roleStr($request->user());
        if ($role !== 'owner') abort(403);

        $payouts = CommissionPayout::with('sales')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['success' => true, 'data' => $payouts]);
    }
}
