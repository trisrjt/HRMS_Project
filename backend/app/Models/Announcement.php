<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Announcement extends Model
{
    use HasFactory;

    protected $fillable = ['title', 'message', 'created_by', 'is_active'];

    public function user()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}