<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_email_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->foreignId('leave_type_id')->constrained()->cascadeOnDelete();
            
            $table->text('to_emails')->nullable(); // JSON or comma-separated
            $table->text('cc_emails')->nullable();
            $table->text('bcc_emails')->nullable();
            
            $table->string('subject_template');
            $table->text('body_template');
            
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // Employee should have only one active template per leave type
            $table->unique(['employee_id', 'leave_type_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_email_templates');
    }
};
