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
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');

            // ✅ Default role = Employee (3)
            $table->foreignId('role_id')
                ->default(3) // 👈 Default role assigned automatically
                ->constrained('roles')
                ->onDelete('cascade');

            // ✅ Department optional (null allowed)
            $table->foreignId('department_id')
                ->nullable()
                ->constrained('departments')
                ->onDelete('set null');

            // ✅ Optional HR fields
            $table->string('phone')->nullable();
            $table->string('employee_code')->nullable();
            $table->date('join_date')->nullable();
            $table->boolean('is_active')->default(true);

            $table->rememberToken();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};