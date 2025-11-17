<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\PerformanceReview;

class PerformanceReviewController extends Controller
{
    public function index()
    {
        return response()->json(PerformanceReview::with(['user', 'reviewer'])->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'user_id' => 'required|exists:users,id',
            'reviewer_id' => 'required|exists:users,id',
            'period' => 'required|string',
            'rating' => 'nullable|integer|min:1|max:5',
            'comments' => 'nullable|string',
        ]);

        $review = PerformanceReview::create($data);

        return response()->json(['message' => 'Review added successfully', 'data' => $review], 201);
    }

    public function show($id)
    {
        return response()->json(PerformanceReview::with(['user', 'reviewer'])->findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $review = PerformanceReview::findOrFail($id);
        $review->update($request->all());
        return response()->json(['message' => 'Review updated successfully', 'data' => $review]);
    }

    public function destroy($id)
    {
        PerformanceReview::findOrFail($id)->delete();
        return response()->json(['message' => 'Review deleted successfully']);
    }
}