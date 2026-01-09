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
            $table->decimal('check_in_latitude', 10, 8)->nullable()->after('check_in');
            $table->decimal('check_in_longitude', 11, 8)->nullable()->after('check_in_latitude');
            $table->decimal('check_out_latitude', 10, 8)->nullable()->after('check_out');
            $table->decimal('check_out_longitude', 11, 8)->nullable()->after('check_out_latitude');
            $table->string('device_id')->nullable()->after('status');
            $table->string('device_type')->nullable()->after('device_id');
            $table->string('browser')->nullable()->after('device_type');
            $table->string('ip_address')->nullable()->after('browser');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropColumn([
                'check_in_latitude',
                'check_in_longitude',
                'check_out_latitude',
                'check_out_longitude',
                'device_id',
                'device_type',
                'browser',
                'ip_address'
            ]);
        });
    }
};
