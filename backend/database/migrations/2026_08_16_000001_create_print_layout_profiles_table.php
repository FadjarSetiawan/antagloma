<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('print_layout_profiles', function (Blueprint $table) {
            $table->id();
            $table->string('document_type', 32)->unique();
            $table->json('layout');
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('print_layout_profiles'); }
};
