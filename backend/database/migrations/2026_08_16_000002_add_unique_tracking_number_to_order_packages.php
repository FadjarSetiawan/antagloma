<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up(): void { Schema::table('order_packages', fn (Blueprint $table) => $table->unique('tracking_number', 'order_packages_tracking_number_unique')); }
 public function down(): void { Schema::table('order_packages', fn (Blueprint $table) => $table->dropUnique('order_packages_tracking_number_unique')); }
};
