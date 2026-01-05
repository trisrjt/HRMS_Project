<?php

namespace App\Http\Controllers;

use App\Models\LeavePolicy;
use App\Models\LeavePolicyRule;
use App\Models\LeaveType;
use App\Models\Employee;
use App\Services\LeavePolicyService;
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
}
