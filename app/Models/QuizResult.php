<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuizResult extends Model
{
    protected $fillable = [
        'user_id', 'quiz_id', 'course_id',
        'score_percentage', 'score_points', 'total_points',
        'passed', 'attempt_number', 'answers', 'time_taken_seconds', 'attempted_at',
    ];
    protected $casts = [
        'passed'       => 'boolean',
        'answers'      => 'array',
        'attempted_at' => 'datetime',
    ];

    public function user()   { return $this->belongsTo(User::class); }
    public function quiz()   { return $this->belongsTo(Quiz::class); }
    public function course() { return $this->belongsTo(Course::class); }
}
