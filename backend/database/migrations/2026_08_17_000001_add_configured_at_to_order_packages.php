<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('order_packages', function (Blueprint $table) {
            $table->timestamp('configured_at')->nullable()->after('weight');
        });

        // Existing packages were previously submitted through “Selesaikan & Buat
        // Nota”; preserve that state when this safeguard is introduced.
        DB::table('order_packages')->whereNull('configured_at')->update(['configured_at' => now()]);
    }

    public function down(): void
    {
        Schema::table('order_packages', function (Blueprint $table) {
            $table->dropColumn('configured_at');
        });
    }
};
