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
        'referral_code', 'referred_by_user_id',
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

    // ── REFERRALS ────────────────────────────────────────────────────────────
    /** People this user referred (their referred_by_user_id points at us). */
    public function referredUsers()
    {
        return $this->hasMany(User::class, 'referred_by_user_id');
    }

    /** Who referred this user, if anyone. */
    public function referrer()
    {
        return $this->belongsTo(User::class, 'referred_by_user_id');
    }

    public function referralCommissions()
    {
        return $this->hasMany(ReferralCommission::class, 'referrer_id');
    }

    public function referralPayouts()
    {
        return $this->hasMany(ReferralPayout::class);
    }

    /**
     * Returns this user's referral code, generating and persisting one on
     * first call. Registration sets this immediately for new accounts (see
     * AuthController::register), but any account created before this
     * feature existed won't have one yet — this backfills it the first time
     * they visit their referral page rather than needing a one-off migration
     * data pass across the whole users table.
     */
    public function ensureReferralCode(): string
    {
        if ($this->referral_code) {
            return $this->referral_code;
        }

        do {
            $code = strtoupper(\Illuminate\Support\Str::random(6));
        } while (self::where('referral_code', $code)->exists());

        $this->update(['referral_code' => $code]);

        return $code;
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
