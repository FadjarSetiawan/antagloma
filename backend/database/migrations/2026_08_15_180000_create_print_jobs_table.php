<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('print_jobs', function (Blueprint $table) {
            $table->id();
            $table->uuid('public_id')->unique();
            $table->foreignId('order_package_id')->constrained()->cascadeOnDelete();
            $table->string('document_type', 32);
            $table->string('token_hash', 64)->unique();
            $table->timestamp('expires_at');
            $table->timestamp('consumed_at')->nullable();
            $table->timestamp('printed_at')->nullable();
            $table->string('printer')->nullable();
            $table->json('result')->nullable();
            $table->timestamps();
            $table->index(['public_id', 'document_type']);
        });
    }
    public function down(): void { Schema::dropIfExists('print_jobs'); }
};
