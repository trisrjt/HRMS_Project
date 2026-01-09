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
        // Add overtime permission to employees table
        if (!Schema::hasColumn('employees', 'overtime_enabled')) {
            Schema::table('employees', function (Blueprint $table) {
                $table->boolean('overtime_enabled')->default(false)->after('ptax_opt_out');
            });
        }

        // Add overtime fields to attendances table
        Schema::table('attendances', function (Blueprint $table) {
            if (!Schema::hasColumn('attendances', 'overtime_start')) {
                $table->time('overtime_start')->nullable()->after('check_out');
            }
            if (!Schema::hasColumn('attendances', 'overtime_end')) {
                $table->time('overtime_end')->nullable()->after('overtime_start');
            }
            if (!Schema::hasColumn('attendances', 'overtime_hours')) {
                $table->decimal('overtime_hours', 5, 2)->nullable()->after('overtime_end');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn('overtime_enabled');
        });

        Schema::table('attendances', function (Blueprint $table) {
            $table->dropColumn(['overtime_start', 'overtime_end', 'overtime_hours']);
        });
    }
};
