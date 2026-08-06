<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->string('tree_code', 20)->nullable()->after('order_id');
            $table->string('tree_name')->nullable()->after('tree_code');
            $table->string('grade', 10)->nullable()->after('tree_name');
            $table->decimal('standard_price', 15, 2)->default(0)->after('price');
            $table->decimal('discount', 15, 2)->default(0)->after('standard_price');
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn(['tree_code', 'tree_name', 'grade', 'standard_price', 'discount']);
        });
    }
};
