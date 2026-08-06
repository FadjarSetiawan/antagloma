<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->date('order_date');
            $table->string('customer_name');
            $table->string('phone', 20);
            $table->string('delivery_method');
            $table->string('province_id')->nullable();
            $table->string('province_name')->nullable();
            $table->string('regency_id')->nullable();
            $table->string('regency_name')->nullable();
            $table->string('district_id')->nullable();
            $table->string('district_name')->nullable();
            $table->text('full_address');
            $table->text('notes')->nullable();
            $table->string('status')->default('WAITING_PROCESS');
            $table->string('payment_method')->nullable();
            $table->string('payment_status')->default('PENDING');
            $table->decimal('shipping_cost', 15, 2)->default(0);
            $table->string('tracking_number')->nullable();
            $table->foreignId('created_by')->constrained('users')->onDelete('restrict');
            $table->foreignId('verified_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('shipped_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'order_date']);
            $table->index(['created_by', 'status']);
            $table->index('order_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
