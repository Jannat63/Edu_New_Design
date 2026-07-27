<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Quiz extends Model
{
    protected $fillable = [
        'course_id', 'lesson_id', 'title', 'description',
        'pass_percentage', 'attempts_allowed', 'time_limit_minutes', 'show_answers',
    ];
    protected $casts = ['show_answers' => 'boolean'];

    public function course()    { return $this->belongsTo(Course::class); }
    public function lesson()    { return $this->belongsTo(Lesson::class); }
    public function questions() { return $this->hasMany(Question::class)->orderBy('sort_order'); }
    public function results()   { return $this->hasMany(QuizResult::class); }

    public function getTotalPointsAttribute(): int
    {
        return $this->questions()->sum('points');
    }

    public function userPassedQuiz(int $userId): bool
    {
        return $this->results()
                    ->where('user_id', $userId)
                    ->where('passed', true)
                    ->exists();
    }

    public function userAttemptsCount(int $userId): int
    {
        return $this->results()->where('user_id', $userId)->count();
    }
}
