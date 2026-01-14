<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PayrollPolicy;

class PayrollPolicySeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $wbPtaxSlabs = [
            [
                'min_salary' => 0,
                'max_salary' => 10000,
                'tax_amount' => 0
            ],
            [
                'min_salary' => 10001,
                'max_salary' => 15000,
                'tax_amount' => 110
            ],
            [
                'min_salary' => 15001,
                'max_salary' => 25000,
                'tax_amount' => 130
            ],
            [
                'min_salary' => 25001,
                'max_salary' => 40000,
                'tax_amount' => 150
            ],
            [
                'min_salary' => 40001,
                'max_salary' => null, // Above 40,000
                'tax_amount' => 200
            ]
        ];

        $policies = [
            'basic_percentage' => 40,
            'hra_percentage' => 20,
            'da_percentage' => 10,
            'pf_enabled' => true,
            'pf_employee_share' => 12,
            'pf_employer_share' => 12,
            'esic_enabled' => true,
            'esic_employee_share' => 0.75,
            'esic_employer_share' => 3.25,
            'ptax_enabled' => true, // Enabled by default as per request
            'ptax_slabs' => json_encode($wbPtaxSlabs)
        ];

        foreach ($policies as $key => $value) {
            PayrollPolicy::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }
    }
}
