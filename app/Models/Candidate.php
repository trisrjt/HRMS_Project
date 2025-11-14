<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Candidate extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'email', 'contact_no', 'recruitment_id', 'resume_link', 'status'];

    public function recruitment()
    {
        return $this->belongsTo(Recruitment::class);
    }

    public function interviews()
    {
        return $this->hasMany(Interview::class);
    }
}