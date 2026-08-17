<?php

use App\Enums\OrderStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Bring historic package deliveries in line with the current workflow.
     * An order is finished only once every package has a tracking number.
     */
    public function up(): void
    {
        DB::table('orders')
            ->where('status', OrderStatus::PACKING_COMPLETED->value)
            ->whereExists(function ($query) {
                $query->selectRaw('1')
                    ->from('order_packages')
                    ->whereColumn('order_packages.order_id', 'orders.id');
            })
            ->whereNotExists(function ($query) {
                $query->selectRaw('1')
                    ->from('order_packages')
                    ->whereColumn('order_packages.order_id', 'orders.id')
                    ->where(function ($tracking) {
                        $tracking->whereNull('tracking_number')->orWhere('tracking_number', '');
                    });
            })
            ->update([
                'status' => OrderStatus::COMPLETED->value,
                'shipped_at' => DB::raw('COALESCE(shipped_at, NOW())'),
                'completed_at' => DB::raw('COALESCE(completed_at, NOW())'),
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        // Historical delivery completion must never be reverted automatically.
    }
};
