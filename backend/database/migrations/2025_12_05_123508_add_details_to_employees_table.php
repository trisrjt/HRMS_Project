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
            $table->date('dob')->nullable()->after('designation');
            $table->string('aadhar_number', 20)->nullable()->after('dob');
            $table->string('pan_number', 20)->nullable()->after('aadhar_number');

            $table->string('emergency_contact', 20)->nullable()->after('phone');
            $table->string('gender', 20)->nullable()->after('emergency_contact');
            $table->string('marital_status', 20)->nullable()->after('gender');

            $table->string('profile_photo', 255)->nullable()->after('address');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn([
                'dob',
                'aadhar_number',
                'pan_number',
                'phone',
                'emergency_contact',
                'gender',
                'marital_status',
                'address',
                'profile_photo'
            ]);
        });
    }
};
