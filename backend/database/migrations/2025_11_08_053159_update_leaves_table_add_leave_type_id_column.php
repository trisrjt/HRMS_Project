<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leaves', function (Blueprint $table) {
            // Drop old column if it exists
            if (Schema::hasColumn('leaves', 'leave_type')) {
                $table->dropColumn('leave_type');
            }

            // Add the new foreign key column
            $table->foreignId('leave_type_id')->after('employee_id')->constrained('leave_types')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('leaves', function (Blueprint $table) {
            $table->dropForeign(['leave_type_id']);
            $table->dropColumn('leave_type_id');
            $table->string('leave_type')->nullable();
        });
    }
};