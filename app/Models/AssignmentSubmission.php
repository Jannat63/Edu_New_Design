<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AssignmentSubmission extends Model
{
    protected $fillable = [
        'assignment_id', 'user_id', 'course_id',
        'file_path', 'file_name', 'file_size', 'notes',
        'score', 'feedback', 'status', 'submitted_at', 'graded_at', 'graded_by',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'graded_at'    => 'datetime',
        'score'        => 'integer',
    ];

    public function assignment() { return $this->belongsTo(Assignment::class); }
    public function student()    { return $this->belongsTo(User::class, 'user_id'); }
    public function grader()     { return $this->belongsTo(User::class, 'graded_by'); }

    public function getFileUrlAttribute(): ?string
    {
        // Relative API path, not a direct public-storage URL — the file
        // lives on the private disk now and must go through
        // AssignmentController::download(), which checks the requester is
        // the owning student, the course's instructor, or an admin.
        // The frontend fetches this with api.download() (auth header +
        // blob), not a plain <a href>.
        return $this->file_path ? '/assignments/submissions/' . $this->id . '/download' : null;
    }

    public function isGraded(): bool
    {
        return $this->status === 'graded';
    }
}
