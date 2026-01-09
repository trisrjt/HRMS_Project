<?php

namespace App\Http\Controllers;

use App\Models\EmployeeDocument;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class EmployeeDocumentController extends Controller
{
    /**
     * Display a listing of the documents.
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $query = EmployeeDocument::with('employee.user:id,name,email'); // Eager load for display

        if ($user->role_id == 4) {
            // Employee: View own only
            if (!$user->employee) {
                return response()->json(['message' => 'Employee profile not found.'], 404);
            }
            $query->where('employee_id', $user->employee->id);
        } else {
            // Admin/HR/SuperAdmin
            // Filter by employee if provided
            if ($request->has('employee_id')) {
                $query->where('employee_id', $request->employee_id);
            }
            
            // Filter by document type if provided
            if ($request->has('document_type')) {
                $query->where('document_type', $request->document_type);
            }
        }

        return response()->json($query->orderByDesc('created_at')->get());
    }

    /**
     * Store a newly created document.
     */
    public function store(Request $request)
    {
        $user = auth()->user();

        $request->validate([
            'document_type' => 'required|string|max:255',
            'document_title' => 'required|string|max:255',
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:2048', // 2MB Max
            // Admin/HR must provide employee_id, Employee uses own
            'employee_id' => ($user->role_id != 4) ? 'required|exists:employees,id' : 'nullable',
        ]);

        $employeeId = null;

        if ($user->role_id == 4) {
            $employeeId = $user->employee->id;
            
            // Optional: Check if employee is allowed to upload this type? 
            // For now, allow all based on requirements.
        } else {
             // Admin/HR
             $employeeId = $request->employee_id;
        }

        if (!$employeeId) {
            return response()->json(['message' => 'Employee identifier missing.'], 400);
        }
        
        // Handle File Upload
        $path = $request->file('file')->store('employee_documents', 'public');
        $size = $request->file('file')->getSize(); // in bytes
        $sizeKb = round($size / 1024);

        $document = EmployeeDocument::create([
            'employee_id' => $employeeId,
            'document_type' => $request->document_type,
            'document_title' => $request->document_title,
            'file_path' => $path,
            'file_size' => $sizeKb,
            'uploaded_by' => $user->id,
        ]);

        return response()->json([
            'message' => 'Document uploaded successfully',
            'document' => $document
        ], 201);
    }

    /**
     * Remove the specified document.
     */
    public function destroy($id)
    {
        $user = auth()->user();
        
        // Only Admin (1, 2) and HR (3 with permission) can delete?
        // Requirement says: "Delete documents (if permission allows)".
        // Assuming Role 4 cannot delete.
        
        if ($user->role_id == 4) {
             return response()->json(['message' => 'Unauthorized'], 403);
        }

        $document = EmployeeDocument::findOrFail($id);
        
        // Delete file from storage
        if (Storage::disk('public')->exists($document->file_path)) {
            Storage::disk('public')->delete($document->file_path);
        }

        $document->delete();

        return response()->json(['message' => 'Document deleted successfully']);
    }

    /**
     * Download the specified document.
     */
    public function download($id)
    {
        $user = auth()->user();
        $document = EmployeeDocument::findOrFail($id);

        // Authorization Check
        if ($user->role_id == 4) {
            // Employee can only download own
            if ($document->employee_id != $user->employee->id) {
                 return response()->json(['message' => 'Unauthorized'], 403);
            }
        } 
        // Admin/HR can download any

        $path = storage_path('app/public/' . $document->file_path);

        if (!file_exists($path)) {
            return response()->json(['message' => 'File not found on server'], 404);
        }

        return response()->download($path, $document->document_title . '.' . pathinfo($path, PATHINFO_EXTENSION));
    }
}
