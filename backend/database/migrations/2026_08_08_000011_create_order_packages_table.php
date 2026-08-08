<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('order_packages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->string('letter', 8);
            $table->string('package_type')->nullable();
            $table->decimal('weight', 10, 2)->nullable();
            $table->boolean('nota_printed')->default(false);
            $table->timestamp('nota_printed_at')->nullable();
            $table->boolean('label_printed')->default(false);
            $table->timestamp('label_printed_at')->nullable();
            $table->timestamp('waiting_photo_at')->nullable();
            $table->timestamp('photo_uploaded_at')->nullable();
            $table->string('tracking_number')->nullable();
            $table->decimal('shipping_cost', 15, 2)->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->unique(['order_id', 'letter']);
            $table->index(['nota_printed', 'label_printed', 'photo_uploaded_at']);
        });
        Schema::create('order_package_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_package_id')->constrained('order_packages')->cascadeOnDelete();
            $table->foreignId('order_item_id')->constrained('order_items')->cascadeOnDelete();
            $table->unsignedInteger('quantity');
            $table->timestamps();
            $table->unique(['order_package_id', 'order_item_id']);
        });
        Schema::table('packing_images', function (Blueprint $table) {
            $table->foreignId('order_package_id')->nullable()->after('order_id')->constrained('order_packages')->cascadeOnDelete();
            $table->index('order_package_id');
        });
    }
    public function down(): void {
        Schema::table('packing_images', fn (Blueprint $table) => $table->dropConstrainedForeignId('order_package_id'));
        Schema::dropIfExists('order_package_items');
        Schema::dropIfExists('order_packages');
    }
};
