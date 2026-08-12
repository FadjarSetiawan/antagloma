<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commission_payout_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payout_id')->constrained('commission_payouts')->onDelete('cascade');
            $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');
            $table->timestamps();

            // One order can only be covered by one payout
            $table->unique(['payout_id', 'order_id']);
            $table->unique('order_id'); // Each order can only be in one payout ever
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commission_payout_orders');
    }
};
