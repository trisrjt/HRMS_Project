<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('leaves', function (Blueprint $table) {
            $table->date('approved_start_date')->nullable()->after('end_date');
            $table->date('approved_end_date')->nullable()->after('approved_start_date');
            $table->integer('approved_days')->nullable()->after('approved_end_date');
            $table->timestamp('withdrawn_at')->nullable()->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leaves', function (Blueprint $table) {
            $table->dropColumn(['approved_start_date', 'approved_end_date', 'approved_days', 'withdrawn_at']);
        });
    }
};
