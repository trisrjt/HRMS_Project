<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Create payroll_policies table
        if (!Schema::hasTable('payroll_policies')) {
            Schema::create('payroll_policies', function (Blueprint $table) {
                $table->id();
                $table->string('key')->unique();
                $table->text('value')->nullable();
                $table->string('description')->nullable();
                $table->timestamps();
            });

            // Seed Default Policies
            DB::table('payroll_policies')->insert([
                [
                    'key' => 'basic_percentage',
                    'value' => '70',
                    'description' => 'Percentage of Gross Salary allocated to Basic',
                    'created_at' => now(), 'updated_at' => now()
                ],
                [
                    'key' => 'hra_percentage',
                    'value' => '30',
                    'description' => 'Percentage of Gross Salary allocated to HRA',
                    'created_at' => now(), 'updated_at' => now()
                ],
                [
                    'key' => 'pf_enabled',
                    'value' => '1',
                    'description' => 'Global enable/disable PF (1=On, 0=Off)',
                    'created_at' => now(), 'updated_at' => now()
                ],
                [
                    'key' => 'esic_enabled',
                    'value' => '1',
                    'description' => 'Global enable/disable ESIC (1=On, 0=Off)',
                    'created_at' => now(), 'updated_at' => now()
                ],
                [
                    'key' => 'ptax_enabled',
                    'value' => '1',
                    'description' => 'Global enable/disable Professional Tax (1=On, 0=Off)',
                    'created_at' => now(), 'updated_at' => now()
                ],
                [
                    'key' => 'ptax_slabs',
                    'value' => json_encode([
                        ['min' => 0, 'max' => 10000, 'amount' => 0],
                        ['min' => 10001, 'max' => 15000, 'amount' => 110],
                        ['min' => 15001, 'max' => 25000, 'amount' => 130],
                        ['min' => 25001, 'max' => 40000, 'amount' => 150],
                        ['min' => 40001, 'max' => 99999999, 'amount' => 200],
                    ]),
                    'description' => 'Professional Tax Slabs (JSON)',
                    'created_at' => now(), 'updated_at' => now()
                ],
            ]);
        }

        // 2. Add opt-out flags to employees table
        Schema::table('employees', function (Blueprint $table) {
            if (!Schema::hasColumn('employees', 'pf_opt_out')) {
                $table->boolean('pf_opt_out')->default(false)->after('department_id'); // Adjust position if needed, roughly
            }
            if (!Schema::hasColumn('employees', 'esic_opt_out')) {
                $table->boolean('esic_opt_out')->default(false)->after('pf_opt_out');
            }
            if (!Schema::hasColumn('employees', 'ptax_opt_out')) {
                $table->boolean('ptax_opt_out')->default(false)->after('esic_opt_out');
            }
        });

        // 3. Add breakdown columns to payslips table
        Schema::table('payslips', function (Blueprint $table) {
            // Check columns to avoid duplication if partial run
            if (!Schema::hasColumn('payslips', 'basic')) {
                $table->decimal('basic', 10, 2)->default(0)->after('year'); // after year
            }
            if (!Schema::hasColumn('payslips', 'hra')) {
                $table->decimal('hra', 10, 2)->default(0)->after('basic');
            }
            if (!Schema::hasColumn('payslips', 'pf')) {
                $table->decimal('pf', 10, 2)->default(0)->after('hra');
            }
            if (!Schema::hasColumn('payslips', 'esic')) {
                $table->decimal('esic', 10, 2)->default(0)->after('pf');
            }
            if (!Schema::hasColumn('payslips', 'ptax')) {
                $table->decimal('ptax', 10, 2)->default(0)->after('esic');
            }
            if (!Schema::hasColumn('payslips', 'gross_salary')) {
                $table->decimal('gross_salary', 10, 2)->default(0)->after('ptax');
            }
            if (!Schema::hasColumn('payslips', 'days_worked')) {
                $table->decimal('days_worked', 5, 2)->default(0)->after('gross_salary'); // Use decimal for half days?
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payroll_policies');

        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn(['pf_opt_out', 'esic_opt_out', 'ptax_opt_out']);
        });

        Schema::table('payslips', function (Blueprint $table) {
            $table->dropColumn(['basic', 'hra', 'pf', 'esic', 'ptax', 'gross_salary', 'days_worked']);
        });
    }
};
