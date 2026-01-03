<?php

namespace App\Http\Controllers;

use App\Models\PayrollPolicy;
use Illuminate\Http\Request;

class PayrollPolicyController extends Controller
{
    public function index()
    {
        // Return key-value pairs for frontend
        return response()->json(PayrollPolicy::all()->pluck('value', 'key'));
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'basic_percentage' => 'required|numeric|min:0|max:100',
            'hra_percentage' => 'required|numeric|min:0|max:100',
            'pf_enabled' => 'required|boolean',
            'esic_enabled' => 'required|boolean',
            'ptax_enabled' => 'required|boolean',
            'ptax_slabs' => 'required|json', // Validate as JSON string
        ]);
        
        // Ensure Basic + HRA = 100?
        if (($data['basic_percentage'] + $data['hra_percentage']) != 100) {
             return response()->json(['message' => 'Basic and HRA percentages must sum to 100%'], 422);
        }

        foreach ($data as $key => $value) {
            PayrollPolicy::updateOrCreate(
                ['key' => $key],
                ['value' => $value] // Store directly (strings/json)
            );
        }

        return response()->json(['message' => 'Policies updated successfully']);
    }
}
