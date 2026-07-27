<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// ── LESSON PROGRESS ───────────────────────────────────────────────────────────
class LessonProgress extends Model
{
    protected $table    = 'lesson_progress';
    protected $fillable = [
        'user_id', 'lesson_id', 'course_id',
        'last_position_seconds', 'is_completed', 'completed_at',
    ];
    protected $casts = [
        'is_completed' => 'boolean',
        'completed_at' => 'datetime',
    ];

    public function user()   { return $this->belongsTo(User::class); }
    public function lesson() { return $this->belongsTo(Lesson::class); }
    public function course() { return $this->belongsTo(Course::class); }
}
