<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('bank_name', 20)->nullable()->after('payment_method');
            $table->decimal('buyer_shipping_cost', 15, 2)->default(0)->after('bank_name');
            $table->string('payment_proof_path')->nullable()->after('buyer_shipping_cost');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['bank_name', 'buyer_shipping_cost', 'payment_proof_path']);
        });
    }
};
