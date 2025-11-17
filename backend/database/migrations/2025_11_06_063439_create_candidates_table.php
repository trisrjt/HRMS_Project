<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('candidates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('contact_no', 15)->nullable();
            $table->foreignId('applied_for')->constrained('recruitments')->onDelete('cascade');
            $table->string('resume_link')->nullable();
            $table->enum('status', ['applied', 'shortlisted', 'interviewed', 'selected', 'rejected'])->default('applied');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('candidates');
    }
};