<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('print_jobs', function (Blueprint $table) {
            $table->text('notes_override')->nullable()->after('document_type');
        });
    }

    public function down(): void
    {
        Schema::table('print_jobs', fn (Blueprint $table) => $table->dropColumn('notes_override'));
    }
};
