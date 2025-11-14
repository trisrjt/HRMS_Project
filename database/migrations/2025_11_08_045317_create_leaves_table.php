<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leaves', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->onDelete('cascade');
            $table->string('leave_type');
            $table->date('start_date');
            $table->date('end_date');
            $table->text('reason')->nullable();
            $table->string('status')->default('Pending'); // Pending, Approved, Rejected
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leaves');
    }
};