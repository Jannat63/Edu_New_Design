<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Lesson extends Model
{
    protected $fillable = [
        'section_id', 'course_id', 'title', 'type',
        'video_url', 'video_thumbnail', 'duration_seconds',
        'content', 'resources', 'is_preview', 'available_at', 'sort_order',
    ];

    protected $casts = [
        'resources'    => 'array',
        'is_preview'   => 'boolean',
        'available_at' => 'datetime',
    ];

    public function section()  { return $this->belongsTo(Section::class); }
    public function course()   { return $this->belongsTo(Course::class); }
    public function progress() { return $this->hasMany(LessonProgress::class); }
    public function quiz()       { return $this->hasOne(Quiz::class); }
    public function assignment() { return $this->hasOne(Assignment::class); }

    /**
     * True if this lesson's content-drip release date hasn't arrived yet.
     * Course owner and admins always bypass this (they need to be able to
     * see/edit content before it goes live for students) — pass the
     * requesting user in so we can check that.
     */
    public function isDripLockedFor(?User $user): bool
    {
        if (!$this->available_at || now()->gte($this->available_at)) {
            return false;
        }

        if ($user && ($user->isAdmin() || $this->course->instructor_id === $user->id)) {
            return false;
        }

        return true;
    }

    public function getDurationFormattedAttribute(): string
    {
        if (!$this->duration_seconds) return '0:00';
        $m = intdiv($this->duration_seconds, 60);
        $s = $this->duration_seconds % 60;
        return $m > 59
            ? sprintf('%dh %02dm', intdiv($m, 60), $m % 60)
            : sprintf('%d:%02d', $m, $s);
    }
}
