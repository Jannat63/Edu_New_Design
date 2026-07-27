<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Assignment extends Model
{
    protected $fillable = [
        'lesson_id', 'course_id', 'title', 'description', 'instructions',
        'max_score', 'allow_late_submission', 'accepted_file_types', 'max_file_size_mb',
    ];

    protected $casts = [
        'allow_late_submission' => 'boolean',
        'max_score'             => 'integer',
        'max_file_size_mb'      => 'integer',
    ];

    public function lesson()      { return $this->belongsTo(Lesson::class); }
    public function course()      { return $this->belongsTo(Course::class); }
    public function submissions() { return $this->hasMany(AssignmentSubmission::class); }

    public function submissionFor(int $userId): ?AssignmentSubmission
    {
        return $this->submissions()->where('user_id', $userId)->first();
    }

    public function getAcceptedTypesArrayAttribute(): array
    {
        return array_map('trim', explode(',', $this->accepted_file_types));
    }
}
