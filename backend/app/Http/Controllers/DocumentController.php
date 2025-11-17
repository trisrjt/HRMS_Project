<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Document;

class DocumentController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'doc_type' => 'required|string|max:255',
            'file' => 'required|file|max:2048',
        ]);

        $path = $request->file('file')->store('documents', 'public');

        $document = Document::create([
            'user_id' => auth()->id(),
            'doc_type' => $request->doc_type,
            'file_path' => $path,
        ]);

        return response()->json([
            'message' => 'Document uploaded successfully!',
            'data' => $document,
        ]);
    }

    public function index()
    {
        return response()->json(Document::where('user_id', auth()->id())->get());
    }

    public function show($id)
    {
        $document = Document::find($id);

        if (!$document) {
            return response()->json(['message' => 'Document not found'], 404);
        }

        return response()->json($document);
    }

    public function destroy($id)
    {
        $document = Document::find($id);

        if (!$document) {
            return response()->json(['message' => 'Document not found'], 404);
        }

        $document->delete();

        return response()->json(['message' => 'Document deleted successfully']);
    }
}