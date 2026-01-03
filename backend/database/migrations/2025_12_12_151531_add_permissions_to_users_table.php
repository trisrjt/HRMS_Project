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
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('can_manage_employees')->default(false);
            $table->boolean('can_view_employees')->default(false);
            $table->boolean('can_manage_salaries')->default(false);
            $table->boolean('can_view_salaries')->default(false);
            $table->boolean('can_manage_attendance')->default(false);
            $table->boolean('can_view_attendance')->default(false);
            $table->boolean('can_manage_leaves')->default(false);
            $table->boolean('can_view_leaves')->default(false);
            $table->boolean('can_manage_departments')->default(false);
            $table->boolean('can_manage_payslips')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            //
        });
    }
};
