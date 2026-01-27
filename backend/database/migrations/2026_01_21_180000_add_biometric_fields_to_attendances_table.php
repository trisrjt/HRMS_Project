<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->string('biometric_method')->nullable()->after('checked_out_by');
            $table->text('face_snapshot_url')->nullable()->after('biometric_method');
            $table->text('device_event_id')->nullable()->after('face_snapshot_url');
            $table->json('device_metadata')->nullable()->after('device_event_id');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropColumn(['biometric_method', 'face_snapshot_url', 'device_event_id', 'device_metadata']);
        });
    }
};
