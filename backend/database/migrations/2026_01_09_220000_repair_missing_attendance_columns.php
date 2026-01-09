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
            if (!Schema::hasColumn('attendances', 'check_in_latitude')) {
                $table->decimal('check_in_latitude', 10, 8)->nullable()->after('check_in');
            }
            if (!Schema::hasColumn('attendances', 'check_in_longitude')) {
                $table->decimal('check_in_longitude', 11, 8)->nullable()->after('check_in_latitude');
            }
            if (!Schema::hasColumn('attendances', 'check_out_latitude')) {
                $table->decimal('check_out_latitude', 10, 8)->nullable()->after('check_out');
            }
            if (!Schema::hasColumn('attendances', 'check_out_longitude')) {
                $table->decimal('check_out_longitude', 11, 8)->nullable()->after('check_out_latitude');
            }
            if (!Schema::hasColumn('attendances', 'device_id')) {
                $table->string('device_id')->nullable()->after('status');
            }
            if (!Schema::hasColumn('attendances', 'device_type')) {
                $table->string('device_type')->nullable()->after('device_id');
            }
            if (!Schema::hasColumn('attendances', 'browser')) {
                $table->string('browser')->nullable()->after('device_type');
            }
            if (!Schema::hasColumn('attendances', 'ip_address')) {
                $table->string('ip_address')->nullable()->after('browser');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            // We don't drop them here to be safe and avoid conflict with the original migration
        });
    }
};
