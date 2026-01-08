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
        Schema::table('attendances', function (Blueprint $table) {
            $table->string('checked_in_by')->default('self')->after('ip_address'); // 'self', 'hr', 'admin', 'superadmin'
            $table->string('checked_out_by')->nullable()->after('checked_in_by'); // 'self', 'hr', 'admin', 'superadmin', 'auto'
            $table->string('checkout_type')->nullable()->after('checked_out_by'); // 'manual', 'auto'
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropColumn(['checked_in_by', 'checked_out_by', 'checkout_type']);
        });
    }
};
