<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Enrollment extends Model
{
    protected $fillable = [
        'user_id', 'course_id', 'payment_id', 'amount_paid',
        'progress_pct', 'completed_lessons',
        'last_lesson_id', 'enrolled_at', 'completed_at',
    ];

    protected $casts = [
        'enrolled_at'   => 'datetime',
        'completed_at'  => 'datetime',
        'amount_paid'   => 'decimal:2',
    ];

    public function user()       { return $this->belongsTo(User::class); }
    public function course()     { return $this->belongsTo(Course::class); }
    public function payment()   { return $this->belongsTo(Payment::class); }
    public function lastLesson() { return $this->belongsTo(Lesson::class, 'last_lesson_id'); }

    public function isCompleted(): bool { return $this->progress_pct >= 100; }

    // Recalculate progress based on lesson_progress records
    public function recalculateProgress(): void
    {
        $totalLessons = $this->course->total_lessons;
        if ($totalLessons === 0) return;

        $done = LessonProgress::where('user_id', $this->user_id)
                              ->where('course_id', $this->course_id)
                              ->where('is_completed', true)
                              ->count();

        $this->update([
            'completed_lessons' => $done,
            'progress_pct'      => (int) round(($done / $totalLessons) * 100),
            'completed_at'      => $done >= $totalLessons ? now() : null,
        ]);
    }
}
