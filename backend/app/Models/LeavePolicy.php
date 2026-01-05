<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LeavePolicy extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'joining_category',
        'effective_from',
        'status',
    ];

    public function rules()
    {
        return $this->hasMany(LeavePolicyRule::class);
    }
}
