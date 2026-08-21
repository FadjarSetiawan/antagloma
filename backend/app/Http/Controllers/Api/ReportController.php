<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    private static function roleStr($user): string
    {
        return $user?->role instanceof \BackedEnum
            ? $user->role->value
            : (string) ($user?->role ?? '');
    }

    private static function calculateOrderPlantNet(Order $order): float
    {
        $statusStr = $order->status instanceof \BackedEnum ? $order->status->value : (string) $order->status;
        if ($statusStr === 'RETURNED') {
            return 0.0;
        }
        $gross = collect($order->items ?? [])->sum(fn ($item) => (float) ($item->price ?? 0));
        $returnAmount = (float) ($order->return_total ?? collect($order->packages ?? [])->sum(fn ($p) => (float) ($p->return_amount ?? 0)));
        return max(0, $gross - $returnAmount);
    }

    private static function calculateOrderReturnAmount(Order $order): float
    {
        $statusStr = $order->status instanceof \BackedEnum ? $order->status->value : (string) $order->status;
        $gross = collect($order->items ?? [])->sum(fn ($item) => (float) ($item->price ?? 0));
        $packageReturn = collect($order->packages ?? [])->sum(fn ($p) => (float) ($p->return_amount ?? 0));
        if ($statusStr === 'RETURNED') {
            return $packageReturn > 0 ? $packageReturn : $gross;
        }
        return (float) ($order->return_total ?? $packageReturn);
    }

    private static function calculateOrderReturnedPackages(Order $order): int
    {
        $statusStr = $order->status instanceof \BackedEnum ? $order->status->value : (string) $order->status;
        $count = collect($order->packages ?? [])->filter(fn ($p) => filled($p->returned_at) || ($p->return_status ?? null) === 'RETURNED')->count();
        if ($statusStr === 'RETURNED') {
            if ($count > 0) return $count;
            return count($order->packages ?? []) > 0 ? count($order->packages) : 1;
        }
        return (int) ($order->returned_package_count ?? $count);
    }

    public function sales(Request $request): JsonResponse
    {
        $user = $request->user();
        $role = self::roleStr($user);
        abort_unless(in_array($role, ['owner', 'admin'], true), 403, 'Hanya Owner atau Admin yang dapat mengakses laporan.');

        $period = $request->query('period', 'month'); // 'all', 'date', 'month', 'year'
        $dateParam = $request->query('date');
        $monthParam = $request->query('month', now()->month);
        $yearParam = $request->query('year', now()->year);
        $salesId = $request->query('sales_id');

        $query = Order::with(['creator', 'items', 'packages']);

        // Exclude unverified payment orders from sales reports
        $query->where('status', '!=', 'WAITING_PROCESS')
              ->where('status', '!=', 'CANCELLED');

        if ($period === 'date' && !empty($dateParam)) {
            $query->whereDate('order_date', $dateParam);
        } elseif ($period === 'month') {
            $query->whereMonth('order_date', (int) $monthParam)
                  ->whereYear('order_date', (int) $yearParam);
        } elseif ($period === 'year') {
            $query->whereYear('order_date', (int) $yearParam);
        }

        $allPeriodOrders = $query->orderBy('order_date', 'desc')->get();

        $visibleOrders = $allPeriodOrders;
        if (!empty($salesId) && $salesId !== 'all') {
            $visibleOrders = $visibleOrders->filter(fn ($o) => (string) ($o->creator?->id ?? $o->created_by) === (string) $salesId);
        }

        $totalPlantOmzet = $visibleOrders->sum(fn ($o) => self::calculateOrderPlantNet($o));
        $periodPlantOmzet = $allPeriodOrders->sum(fn ($o) => self::calculateOrderPlantNet($o));

        $totalBuyerShipping = $visibleOrders->sum(fn ($o) => (float) ($o->buyer_shipping_cost ?? 0));
        $totalExpeditionShipping = $visibleOrders->sum(function ($o) {
            if (!empty($o->packages) && count($o->packages) > 0) {
                return collect($o->packages)->sum(fn ($p) => (float) ($p->shipping_cost ?? 0));
            }
            return (float) ($o->shipping_cost ?? 0);
        });
        $totalShippingDifference = $totalBuyerShipping - $totalExpeditionShipping;

        $totalCommission = $visibleOrders->sum(function ($o) {
            $plantNet = self::calculateOrderPlantNet($o);
            $rate = (float) ($o->creator?->commission_rate ?? 5);
            return round($plantNet * $rate / 100);
        });

        $totalReturnAmount = $visibleOrders->sum(fn ($o) => self::calculateOrderReturnAmount($o));
        $totalReturnedPackages = $visibleOrders->sum(fn ($o) => self::calculateOrderReturnedPackages($o));

        $totalOrdersCount = $visibleOrders->filter(fn ($o) => ($o->status instanceof \BackedEnum ? $o->status->value : (string) $o->status) !== 'RETURNED')->count();
        $totalPlantsSold = $visibleOrders->sum(function ($o) {
            $grossQty = collect($o->items ?? [])->sum(fn ($i) => (int) ($i->quantity ?? 1));
            $returnedItemCount = (int) ($o->returned_item_count ?? 0);
            return max(0, $grossQty - $returnedItemCount);
        });
        $totalPackagesSent = $visibleOrders->sum(function ($o) {
            return collect($o->packages ?? [])->filter(fn ($p) => (bool) $p->photo_uploaded)->count();
        });

        $estimatedNetProfit = $totalPlantOmzet + $totalShippingDifference - $totalCommission;

        // Sales Performance Breakdown
        $salesList = User::where('role', 'sales')->orderBy('name')->get(['id', 'name', 'commission_rate']);
        $salesPerformance = $salesList->map(function ($s) use ($allPeriodOrders, $periodPlantOmzet) {
            $salesOrders = $allPeriodOrders->filter(fn ($o) => ($o->creator?->id ?? $o->created_by) === $s->id);
            $omzet = $salesOrders->sum(fn ($o) => self::calculateOrderPlantNet($o));
            $orderCount = $salesOrders->count();
            $returnCount = $salesOrders->sum(fn ($o) => self::calculateOrderReturnedPackages($o));
            $returnAmount = $salesOrders->sum(fn ($o) => self::calculateOrderReturnAmount($o));
            $commission = round($omzet * (float) ($s->commission_rate ?? 5) / 100);
            $percentage = $periodPlantOmzet > 0 ? round(($omzet / $periodPlantOmzet) * 100, 2) : 0;

            return [
                'id' => $s->id,
                'name' => $s->name,
                'order_count' => $orderCount,
                'omzet' => $omzet,
                'percentage' => $percentage,
                'return_count' => $returnCount,
                'return_amount' => $returnAmount,
                'commission' => $commission,
            ];
        })->sortByDesc('omzet')->values();

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => [
                    'total_plant_omzet' => $totalPlantOmzet,
                    'estimated_net_profit' => $estimatedNetProfit,
                    'total_orders' => $totalOrdersCount,
                    'total_plants_sold' => $totalPlantsSold,
                    'total_packages_sent' => $totalPackagesSent,
                    'total_buyer_shipping' => $totalBuyerShipping,
                    'total_expedition_shipping' => $totalExpeditionShipping,
                    'total_shipping_difference' => $totalShippingDifference,
                    'total_sales_commission' => $totalCommission,
                    'total_return_amount' => $totalReturnAmount,
                    'total_returned_packages' => $totalReturnedPackages,
                ],
                'sales_performance' => $salesPerformance,
            ],
        ]);
    }

    public function exportCsv(Request $request): StreamedResponse
    {
        $user = $request->user();
        $role = self::roleStr($user);
        abort_unless(in_array($role, ['owner', 'admin'], true), 403, 'Unauthorized.');

        $period = $request->query('period', 'month');
        $dateParam = $request->query('date');
        $monthParam = $request->query('month', now()->month);
        $yearParam = $request->query('year', now()->year);

        $query = Order::with(['creator', 'items', 'packages'])
            ->where('status', '!=', 'WAITING_PROCESS')
            ->where('status', '!=', 'CANCELLED');

        if ($period === 'date' && !empty($dateParam)) {
            $query->whereDate('order_date', $dateParam);
        } elseif ($period === 'month') {
            $query->whereMonth('order_date', (int) $monthParam)->whereYear('order_date', (int) $yearParam);
        } elseif ($period === 'year') {
            $query->whereYear('order_date', (int) $yearParam);
        }

        $orders = $query->orderBy('order_date', 'desc')->get();
        $fileName = 'Laporan_Penjualan_' . date('Ymd_His') . '.csv';

        return response()->streamDownload(function () use ($orders) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, [
                'No Order',
                'Tanggal Order',
                'Nama Customer',
                'No Telepon',
                'Metode Pengiriman',
                'Total Harga Tanaman (Rp)',
                'Ongkir Pembeli (Rp)',
                'Grand Total (Rp)',
                'Metode Pembayaran',
                'Bank Tujuan',
                'Status Order',
                'Sales Pembuat',
            ]);

            foreach ($orders as $o) {
                $plantNet = self::calculateOrderPlantNet($o);
                $shipping = (float) ($o->buyer_shipping_cost ?? 0);
                $grandTotal = $plantNet + $shipping;
                $statusStr = $o->status instanceof \BackedEnum ? $o->status->value : (string) $o->status;

                fputcsv($handle, [
                    $o->order_number,
                    $o->order_date,
                    $o->customer_name,
                    $o->phone,
                    $o->delivery_method,
                    $plantNet,
                    $shipping,
                    $grandTotal,
                    $o->payment_method,
                    $o->bank_name,
                    $statusStr,
                    $o->creator?->name ?? 'Sales Staff',
                ]);
            }

            fclose($handle);
        }, $fileName, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }
}
