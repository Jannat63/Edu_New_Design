<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Section extends Model
{
    protected $fillable = ['course_id', 'title', 'description', 'sort_order'];

    public function course()  { return $this->belongsTo(Course::class); }
    public function lessons() { return $this->hasMany(Lesson::class)->orderBy('sort_order'); }

    public function getTotalDurationAttribute(): int
    {
        return $this->lessons()->sum('duration_seconds');
    }
}
