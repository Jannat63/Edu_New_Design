<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LiveClass extends Model
{
    protected $fillable = [
        'course_id', 'instructor_id', 'title', 'description',
        'scheduled_at', 'duration_minutes', 'room_name', 'status',
    ];

    protected $casts = ['scheduled_at' => 'datetime'];

    public function course()     { return $this->belongsTo(Course::class); }
    public function instructor() { return $this->belongsTo(User::class, 'instructor_id'); }

    public function endsAt(): \Illuminate\Support\Carbon
    {
        return $this->scheduled_at->clone()->addMinutes($this->duration_minutes);
    }

    /** Computed, not a stored state — avoids needing Daily webhooks to know a class is "live" right now. */
    public function isLiveNow(): bool
    {
        return $this->status === 'scheduled'
            && now()->between($this->scheduled_at, $this->endsAt());
    }

    public function hasEnded(): bool
    {
        return $this->status === 'ended' || ($this->status === 'scheduled' && now()->gt($this->endsAt()));
    }
}
