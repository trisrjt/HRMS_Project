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
        // 1. Create Leave Policies Table
        Schema::create('leave_policies', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g., "Permanent Employee Policy 2025"
            $table->string('description')->nullable();
            $table->enum('joining_category', ['New Joinee', 'Intern', 'Permanent']);
            $table->date('effective_from');
            $table->enum('status', ['Active', 'Inactive'])->default('Active');
            $table->timestamps();
        });

        // 2. Create Leave Rules Table (One-to-Many from Policy)
        Schema::create('leave_policy_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('leave_policy_id')->constrained('leave_policies')->onDelete('cascade');
            $table->foreignId('leave_type_id')->constrained('leave_types')->onDelete('cascade');
            
            // Configuration
            $table->float('total_leaves_per_year')->default(0);
            $table->enum('accrual_frequency', ['Monthly', 'Yearly'])->default('Yearly');
            
            $table->boolean('probation_restriction')->default(false);
            $table->boolean('available_during_probation')->default(true); // Redundant? "Probation restriction (yes/no)" usually means *not* available? Or restricted limit? user said "available during probation" in current code. User requirement: "Probation restriction (yes/no)". I'll keep both flags or just one. Let's use `probation_restriction` as strict boolean.
            
            $table->boolean('allow_partial_leave')->default(true);
            
            $table->boolean('carry_forward_allowed')->default(false);
            $table->float('max_carry_forward')->default(0);
            
            $table->boolean('requires_approval')->default(true);
            $table->boolean('auto_approve')->default(false);
            
            $table->timestamps();

            $table->unique(['leave_policy_id', 'leave_type_id']); // One rule per leave type per policy
        });

        // 3. Update Employees Table
        Schema::table('employees', function (Blueprint $table) {
            $table->enum('joining_category', ['New Joinee', 'Intern', 'Permanent'])->default('Permanent')->after('department_id');
            $table->foreignId('leave_policy_id')->nullable()->after('joining_category')->constrained('leave_policies')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropForeign(['leave_policy_id']);
            $table->dropColumn(['leave_policy_id', 'joining_category']);
        });

        Schema::dropIfExists('leave_policy_rules');
        Schema::dropIfExists('leave_policies');
    }
};
