<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void { if (!Schema::hasColumn('users', 'commission_rate')) Schema::table('users', fn (Blueprint $table) => $table->decimal('commission_rate', 5, 2)->default(5)->after('role')); }
    public function down(): void { if (Schema::hasColumn('users', 'commission_rate')) Schema::table('users', fn (Blueprint $table) => $table->dropColumn('commission_rate')); }
};
