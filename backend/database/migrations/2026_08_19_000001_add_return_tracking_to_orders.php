<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('order_packages', function (Blueprint $table) {
            $table->string('return_status')->nullable()->after('completed_at');
            $table->timestamp('returned_at')->nullable()->after('return_status');
            $table->decimal('return_amount', 15, 2)->nullable()->after('returned_at');
        });
        Schema::create('order_returns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('reason');
            $table->string('item_status');
            $table->string('notes', 250)->nullable();
            $table->decimal('refund_amount', 15, 2);
            $table->json('package_ids');
            $table->timestamp('returned_at');
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('order_returns');
        Schema::table('order_packages', function (Blueprint $table) {
            $table->dropColumn(['return_status', 'returned_at', 'return_amount']);
        });
    }
};
