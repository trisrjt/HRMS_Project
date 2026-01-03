<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update Maternity Leave to be Female only
        DB::table('leave_types')
            ->where('name', 'like', '%Maternity%')
            ->update(['applicable_gender' => 'Female']);

        // Optional: Ensure Paternity is Male only if exists
        DB::table('leave_types')
            ->where('name', 'like', '%Paternity%')
            ->update(['applicable_gender' => 'Male']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to All
        DB::table('leave_types')
            ->where('name', 'like', '%Maternity%')
            ->update(['applicable_gender' => 'All']);
            
        DB::table('leave_types')
            ->where('name', 'like', '%Paternity%')
            ->update(['applicable_gender' => 'All']);
    }
};
