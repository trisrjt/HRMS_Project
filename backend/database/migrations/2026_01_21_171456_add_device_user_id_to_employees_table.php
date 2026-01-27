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
        Schema::table('employees', function (Blueprint $table) {
            $table->string('device_user_id')->nullable()->after('employee_code')->comment('Hikvision device user ID');
            $table->index('device_user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropIndex(['device_user_id']);
            $table->dropColumn('device_user_id');
        });
    }
};
