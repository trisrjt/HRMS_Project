<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\EmployeeEmailTemplate;
use App\Models\LeaveType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EmailTemplateController extends Controller
{
    /**
     * Get email preferences for the authenticated employee
     */
    public function getPreferences()
    {
        $user = Auth::user();
        $employee = $user->employee;

        if (!$employee) {
            return response()->json(['message' => 'Employee record not found'], 404);
        }

        // Get all leave types
        $leaveTypes = LeaveType::all();

        // Get existing templates for this employee
        $templates = EmployeeEmailTemplate::where('employee_id', $employee->id)->get()->keyBy('leave_type_id');

        $data = $leaveTypes->map(function ($type) use ($templates, $employee) {
            $template = $templates->get($type->id);

            // Default fallback if no template exists
            $defaultSubject = "Leave Application - " . ($employee->user->name ?? 'Employee');
            $defaultBody = "Hi {ManagerName},\n\nI am applying for " . $type->name . " from {FromDate} to {ToDate}.\n\nReason: {Reason}\n\nThanks,\n{EmployeeName}";

            return [
                'leave_type_id' => $type->id,
                'leave_type_name' => $type->name,
                'has_custom_template' => (bool)$template,
                'to_emails' => $template->to_emails ?? null,
                'cc_emails' => $template->cc_emails ?? null,
                'bcc_emails' => $template->bcc_emails ?? null,
                'subject_template' => $template->subject_template ?? $defaultSubject,
                'body_template' => $template->body_template ?? $defaultBody,
                'is_active' => $template ? $template->is_active : true,
            ];
        });

        return response()->json($data);
    }

    /**
     * Save or update a template for a specific leave type
     */
    public function savePreference(Request $request)
    {
        $request->validate([
            'leave_type_id' => 'required|exists:leave_types,id',
            'subject_template' => 'required|string',
            'body_template' => 'required|string',
            'to_emails' => 'nullable|string',
            'cc_emails' => 'nullable|string',
            'bcc_emails' => 'nullable|string',
        ]);

        $user = Auth::user();
        $employee = $user->employee;

        if (!$employee) {
            return response()->json(['message' => 'Employee record not found'], 404);
        }

        $template = EmployeeEmailTemplate::updateOrCreate(
            [
                'employee_id' => $employee->id,
                'leave_type_id' => $request->leave_type_id,
            ],
            [
                'to_emails' => $request->to_emails,
                'cc_emails' => $request->cc_emails,
                'bcc_emails' => $request->bcc_emails,
                'subject_template' => $request->subject_template,
                'body_template' => $request->body_template,
                'is_active' => true
            ]
        );

        return response()->json(['message' => 'Template saved successfully', 'data' => $template]);
    }
}
