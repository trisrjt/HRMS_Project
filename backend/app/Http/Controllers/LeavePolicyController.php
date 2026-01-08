<?php

namespace App\Http\Controllers;

use App\Models\LeavePolicy;
use App\Models\LeavePolicyRule;
use App\Models\LeaveType;
use App\Models\Employee;
use App\Services\LeavePolicyService;
use App\Models\LeaveGrant;
use App\Models\LeaveBalance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LeavePolicyController extends Controller
{
    protected $leavePolicyService;

    public function __construct(LeavePolicyService $leavePolicyService)
    {
        $this->leavePolicyService = $leavePolicyService;
    }

    // ======================================
    // GET /api/leave-policies
    // ======================================
    public function index()
    {
        // Permission check handled by middleware (role:1,2,3)
        // Grouping logic can be done here or frontend. Let's return flat list with rules.
        $policies = LeavePolicy::with(['rules.leaveType'])->orderBy('joining_category')->get();
        return response()->json($policies);
    }

    // ======================================
    // GET /api/leave-types (Helper for Dropdown)
    // ======================================
    public function getLeaveTypes()
    {
        return response()->json(LeaveType::all());
    }

    // ======================================
    // POST /api/leave-policies
    // ======================================
    public function store(Request $request)
    {
        // Validation
        $request->validate([
            'name' => 'required|string|max:255',
            'joining_category' => 'required|in:New Joinee,Intern,Permanent',
            'effective_from' => 'required|date',
            'status' => 'required|in:Active,Inactive',
            'rules' => 'required|array',
            'rules.*.leave_type_id' => 'required|exists:leave_types,id',
            'rules.*.total_leaves_per_year' => 'required|numeric|min:0',
            // Add other validations as needed
        ]);
        
        // Ensure only one Active policy per category? User didn't strictly say so but implied.
        // "Automatically assign the active leave policy for that category"
        // If multiple active, which one? "Effective From"?
        // I won't enforce unique active constraint in DB, but maybe warn or just handle it in logic (picking latest).

        DB::beginTransaction();
        try {
            $policy = LeavePolicy::create($request->only([
                'name', 'description', 'joining_category', 'effective_from', 'status'
            ]));

            foreach ($request->rules as $ruleData) {
                // Merge policy_id
                $ruleData['leave_policy_id'] = $policy->id;
                LeavePolicyRule::create($ruleData);
            }

            DB::commit();
            
            // Auto-assign validation? 
            // "Policy changes affect future calculations only... Existing approved leaves remain unchanged... Leave balance recalculates only if admin chooses Recalculate"
            // So we do NOT auto-recalculate on create/update unless specified.
            // However, IF this is a new Active policy, and we create a NEW employee, it will be picked up.
            
            return response()->json(['message' => 'Policy created successfully', 'policy' => $policy->load('rules.leaveType')], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to create policy', 'error' => $e->getMessage()], 500);
        }
    }

    // ======================================
    // PUT /api/leave-policies/{id}
    // ======================================
    public function update(Request $request, $id)
    {
        $policy = LeavePolicy::findOrFail($id);

         // Validation
         $request->validate([
            'name' => 'sometimes|string|max:255',
            'joining_category' => 'sometimes|in:New Joinee,Intern,Permanent',
            'rules' => 'sometimes|array',
        ]);

        DB::beginTransaction();
        try {
            $policy->update($request->only([
                'name', 'description', 'joining_category', 'effective_from', 'status'
            ]));

            if ($request->has('rules')) {
                // Sync Rules: Delete old, create new? Or update?
                // Simplest is delete all for this policy and recreate, provided IDs aren't critical for elsewhere.
                // Rules are config. 
                $policy->rules()->delete(); // Delete old rules
                
                foreach ($request->rules as $ruleData) {
                    $ruleData['leave_policy_id'] = $policy->id;
                    LeavePolicyRule::create($ruleData);
                }
            }

            // Sync Policy Changes to All Assigned Employees Immediately
            $assignedEmployees = Employee::where('leave_policy_id', $policy->id)->get();
            foreach ($assignedEmployees as $employee) {
                // Ensure we pass the refreshed policy so it has the new rules
                $this->leavePolicyService->syncBalances($employee, $policy->fresh('rules'));
            }
            
            DB::commit();

            return response()->json(['message' => 'Policy updated successfully', 'policy' => $policy->load('rules.leaveType')]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to update policy', 'error' => $e->getMessage()], 500);
        }
    }

    // ======================================
    // DELETE /api/leave-policies/{id}
    // ======================================
    public function destroy($id)
    {
        if (auth()->user()->role_id != 1) { // Only SuperAdmin? User said "SuperAdmin -> Full access ... Admin -> Cannot delete global policies"
             // How to define "Global"? Maybe check if it's assigned to anyone?
             // For now, let's allow SuperAdmin only for DELETE.
             return response()->json(['message' => 'Only SuperAdmin can delete policies'], 403);
        }

        $policy = LeavePolicy::findOrFail($id);
        
        // Check if assigned?
        if (Employee::where('leave_policy_id', $policy->id)->exists()) {
            return response()->json(['message' => 'Cannot delete policy assigned to employees. Please reassign them first.'], 400);
        }

        $policy->delete();
        return response()->json(['message' => 'Policy deleted successfully']);
    }

    // ======================================
    // POST /api/leave-policies/{id}/recalculate
    // ======================================
    public function recalculate($id)
    {
        // "Leave balance recalculates only if admin chooses Recalculate"
        $policy = LeavePolicy::with('rules')->findOrFail($id);
        
        // Find all employees with this policy assigned
        // OR find all employees matching the CATEGORY and re-assign this policy?
        // User says: "The system should Automatically assign... When joining category changes"
        // But here we are editing the policy. "Policy changes affect future... Leave balance recalculates only if admin chooses Recalculate".
        // This implies we recalculate for employees *currently assigned* to this policy.
        
        $employees = Employee::where('leave_policy_id', $id)->get();
        $count = 0;
        
        foreach ($employees as $employee) {
            $this->leavePolicyService->syncBalances($employee, $policy);
            $count++;
        }
        
        return response()->json(['message' => "Recalculated balances for {$count} employees."]);
    }

    // ======================================
    // GET /api/leave-policies/{id}/carry-forward-candidates
    // ======================================
    public function getCarryForwardCandidates(Request $request, $id)
    {
        $leaveTypeId = $request->query('leave_type_id');
        $customMaxLimit = (float) $request->query('max_limit', 0); // User provided limit
        
        $policy = LeavePolicy::findOrFail($id);
        
        // Removed check for rule->carry_forward_allowed as per request (Manual Override)
        
        // Fetch employees assigned to this policy OR matching the policy's category
        $employees = Employee::with('user')
            ->where(function($query) use ($id, $policy) {
                $query->where('leave_policy_id', $id);
                if ($policy->joining_category) {
                     $query->orWhere('joining_category', $policy->joining_category);
                }
            })
            ->get();
        $candidates = [];

        foreach ($employees as $emp) {
            $balance = LeaveBalance::where('employee_id', $emp->id)
                ->where('leave_type_id', $leaveTypeId)
                ->first();
            
            $dateOfJoining = $emp->date_of_joining ? \Carbon\Carbon::parse($emp->date_of_joining) : null;
            $currentYear = \Carbon\Carbon::now()->year;
            
            // Get Total Quota from Rule
            $rule = LeavePolicyRule::where('leave_policy_id', $id)
                ->where('leave_type_id', $leaveTypeId)
                ->first();
            $totalQuota = $rule ? $rule->total_leaves_per_year : 0;
            
            // Calculate Pro-Rata Allocation if joined this year
            $calculatedQuota = $totalQuota;
            if ($dateOfJoining && $dateOfJoining->year == $currentYear) {
                 // Calculate months remaining in the year including joining month
                 $monthsActive = 12 - $dateOfJoining->month + 1;
                 $calculatedQuota = round(($totalQuota / 12) * $monthsActive, 1);
            }
            
            // Allow override from DB if it exists (Optional, but user implies DB is wrong)
            // For now, we use the MAX of calculated vs DB to be safe, OR blindly trust calculated?
            // "remaining balance should show from their joining yearwise" implies calculated.
            // But we must subtract USED days.
            
            $used = $balance ? $balance->used_days : 0;
            
            // Remaining balance based on Pro-Rata
            $remaining = max(0, $calculatedQuota - $used);
            
            // Accepted: Show ALL employees regardless of balance
            // if ($remaining > 0) {
                 $candidates[] = [
                     'employee_id' => $emp->id,
                     'name' => $emp->user->name,
                     'employee_code' => $emp->employee_code,
                     'joining_date' => $dateOfJoining ? $dateOfJoining->format('Y-m-d') : '-',
                     'allocated_quota' => $calculatedQuota, // Debug info
                     'used' => $used, // Debug info
                     'remaining' => $remaining,
                     'max_allowed' => $customMaxLimit,
                     'proposed_carry_forward' => min($remaining, $customMaxLimit)
                 ];
            // }
        }
        
        return response()->json($candidates);
    }

    // ======================================
    // POST /api/leave-policies/{id}/process-carry-forward
    // ======================================
    public function processCarryForward(Request $request, $id)
    {
        $request->validate([
            'leave_type_id' => 'required|exists:leave_types,id',
            'candidates' => 'required|array',
            'candidates.*.employee_id' => 'required|exists:employees,id',
            'candidates.*.amount' => 'required|numeric|min:0.5',
        ]);

        $leaveTypeId = $request->input('leave_type_id');
        $candidates = $request->input('candidates');
        $count = 0;

        DB::beginTransaction();
        try {
            foreach ($candidates as $cand) {
                // 1. Update Balance (Credit)
                $balance = LeaveBalance::firstOrCreate(
                    ['employee_id' => $cand['employee_id'], 'leave_type_id' => $leaveTypeId],
                    ['allocated_days' => 0, 'used_days' => 0]
                );
                
                $balance->increment('allocated_days', $cand['amount']);
                
                // 2. Log Grant
                LeaveGrant::create([
                    'employee_id' => $cand['employee_id'],
                    'leave_type_id' => $leaveTypeId,
                    'days' => $cand['amount'],
                    'reason' => 'Carry Forward Credit', // Could add Year?
                    'granted_by' => auth()->id() ?? 1 // Fallback to 1 if no auth (should satisfy FK)
                ]);
                
                $count++;
            }
            DB::commit();
            return response()->json(['message' => "Successfully credited carry forward for {$count} employees."]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to process carry forward', 'error' => $e->getMessage()], 500);
        }
    }

}
