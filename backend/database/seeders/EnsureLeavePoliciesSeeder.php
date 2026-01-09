<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\LeavePolicy;
use App\Models\LeaveType;
use App\Models\LeavePolicyRule;

class EnsureLeavePoliciesSeeder extends Seeder
{
    public function run()
    {
        $categories = ['New Joinee', 'Intern', 'Permanent'];
        $leaveTypes = LeaveType::all();

        foreach ($categories as $category) {
            // Check if active policy exists
            $exists = LeavePolicy::where('joining_category', $category)
                        ->where('status', 'Active')
                        ->exists();
            
            if (!$exists) {
                $this->command->info("Creating policy for: $category");
                
                $policy = LeavePolicy::create([
                    'name' => "$category Default Policy",
                    'joining_category' => $category,
                    'effective_from' => now()->subDay(), // Effective immediately
                    'status' => 'Active',
                    'description' => "Auto-generated default policy for $category"
                ]);

                foreach ($leaveTypes as $type) {
                    // Define simple defaults based on category
                    $days = 0;
                    if ($category === 'Permanent') $days = 12;
                    elseif ($category === 'Intern') $days = 6;
                    elseif ($category === 'New Joinee') $days = 6; // Pro-rated or limited

                    // Sick Leave matches casual usually, or slightly less
                    if (str_contains(strtolower($type->name), 'sick')) $days = max(3, $days / 2);

                    LeavePolicyRule::create([
                        'leave_policy_id' => $policy->id,
                        'leave_type_id' => $type->id,
                        'total_leaves_per_year' => $days,
                        'accrual_frequency' => 'Yearly',
                        'probation_restriction' => $category === 'New Joinee',
                        'available_during_probation' => $category !== 'New Joinee',
                        'allow_partial_leave' => true,
                        'carry_forward_allowed' => $category === 'Permanent',
                        'requires_approval' => true,
                    ]);
                }
            } else {
                $this->command->info("Policy already exists for: $category");
            }
        }
    }
}
