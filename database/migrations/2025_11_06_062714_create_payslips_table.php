<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payslips', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->onDelete('cascade');
            $table->integer('month'); // 1–12
            $table->integer('year');
            $table->decimal('total_earnings', 10, 2);
            $table->decimal('total_deductions', 10, 2)->default(0);
            $table->decimal('net_pay', 10, 2);
            $table->date('generated_on')->default(now());
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payslips');
    }
};