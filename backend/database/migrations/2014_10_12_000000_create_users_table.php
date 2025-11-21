<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();

            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');

            // Role (1=SuperAdmin,2=Admin,3=HR,4=Employee)
            $table->foreignId('role_id')
                ->default(4)
                ->constrained('roles')
                ->onDelete('cascade');

            // Temp password (for employee first login)
            $table->boolean('temp_password')->default(0);

            // Account enabled/disabled
            $table->boolean('is_active')->default(true);

            $table->rememberToken();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};