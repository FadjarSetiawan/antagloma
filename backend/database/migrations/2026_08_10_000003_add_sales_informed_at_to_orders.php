<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void { if (!Schema::hasColumn('orders', 'sales_informed_at')) Schema::table('orders', fn (Blueprint $table) => $table->timestamp('sales_informed_at')->nullable()->after('completed_at')); }
    public function down(): void { if (Schema::hasColumn('orders', 'sales_informed_at')) Schema::table('orders', fn (Blueprint $table) => $table->dropColumn('sales_informed_at')); }
};
