<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Announcement extends Model
{
    use HasFactory;

    protected $fillable = [
        'title', 
        'message', 
        'category', 
        'target_audience', 
        'status', 
        'attachment_url', 
        'views_count', 
        'created_by', 
        'is_active'
    ];

    protected $casts = [
        'target_audience' => 'array',
        'is_active' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}