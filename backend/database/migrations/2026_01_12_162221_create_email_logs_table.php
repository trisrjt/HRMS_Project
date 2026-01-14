<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('leave_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete(); // Sender
            
            $table->text('to_recipients');
            $table->text('cc_recipients')->nullable();
            $table->text('bcc_recipients')->nullable();
            
            $table->string('subject');
            $table->text('body');
            
            $table->string('status')->default('Pending'); // Sent, Failed
            $table->text('error_message')->nullable();
            $table->timestamp('sent_at')->nullable();
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_logs');
    }
};
