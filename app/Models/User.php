<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'role_id', 'name', 'email', 'phone', 'avatar',
        'city', 'bio', 'password', 'is_active', 'is_banned',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'is_active'         => 'boolean',
        'is_banned'         => 'boolean',
        'password'          => 'hashed',
    ];

    // ── RELATIONSHIPS ─────────────────────────────────────────────────────────
    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }

    public function enrolledCourses()
    {
        return $this->belongsToMany(Course::class, 'enrollments')
                    ->withPivot(['progress_pct', 'completed_lessons', 'enrolled_at', 'completed_at'])
                    ->withTimestamps();
    }

    public function instructorCourses()
    {
        return $this->hasMany(Course::class, 'instructor_id');
    }

    public function lessonProgress()
    {
        return $this->hasMany(LessonProgress::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function certificates()
    {
        return $this->hasMany(Certificate::class);
    }

    public function quizResults()
    {
        return $this->hasMany(QuizResult::class);
    }

    // ── HELPERS ───────────────────────────────────────────────────────────────
    public function isAdmin(): bool
    {
        return $this->role?->slug === 'admin';
    }

    public function isInstructor(): bool
    {
        return $this->role?->slug === 'instructor';
    }

    public function isEnrolledIn(int $courseId): bool
    {
        return $this->enrollments()->where('course_id', $courseId)->exists();
    }

    public function getAvatarUrlAttribute(): string
    {
        return $this->avatar
            ? asset('storage/' . $this->avatar)
            : 'https://ui-avatars.com/api/?name=' . urlencode($this->name) . '&background=4F46E5&color=fff';
    }
}
