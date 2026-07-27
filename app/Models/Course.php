<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'category_id', 'instructor_id', 'title', 'slug', 'subtitle',
        'description', 'thumbnail', 'preview_video', 'language', 'level',
        'price', 'discount_price', 'status', 'requirements', 'what_you_learn',
        'meta_title', 'meta_description',
    ];

    protected $casts = [
        'requirements'    => 'array',
        'what_you_learn'  => 'array',
        'price'           => 'decimal:2',
        'discount_price'  => 'decimal:2',
        'average_rating'  => 'decimal:2',
    ];

    // ── RELATIONSHIPS ─────────────────────────────────────────────────────────
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function instructor()
    {
        return $this->belongsTo(User::class, 'instructor_id');
    }

    public function sections()
    {
        return $this->hasMany(Section::class)->orderBy('sort_order');
    }

    public function lessons()
    {
        return $this->hasMany(Lesson::class);
    }

    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }

    public function students()
    {
        return $this->belongsToMany(User::class, 'enrollments')
                    ->withPivot('progress_pct', 'enrolled_at', 'completed_at');
    }

    public function reviews()
    {
        return $this->hasMany(Review::class)->where('is_visible', true);
    }

    public function quizzes()
    {
        return $this->hasMany(Quiz::class);
    }

    public function certificates()
    {
        return $this->hasMany(Certificate::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class)->where('status', 'paid');
    }

    // ── SCOPES ────────────────────────────────────────────────────────────────
    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopeByCategory($query, int $categoryId)
    {
        return $query->where('category_id', $categoryId);
    }

    public function scopeByLevel($query, string $level)
    {
        return $query->where('level', $level);
    }

    // ── HELPERS ───────────────────────────────────────────────────────────────
    public function getEffectivePriceAttribute(): float
    {
        return $this->discount_price ?? $this->price;
    }

    public function getDiscountPercentageAttribute(): int
    {
        if (!$this->discount_price || $this->price == 0) return 0;
        return (int) round((1 - $this->discount_price / $this->price) * 100);
    }

    public function getThumbnailUrlAttribute(): string
    {
        return $this->thumbnail
            ? asset('storage/' . $this->thumbnail)
            : '';
    }

    public function updateRatingStats(): void
    {
        $avg = $this->reviews()->avg('rating') ?? 0;
        $count = $this->reviews()->count();
        $this->update([
            'average_rating' => round($avg, 2),
            'total_reviews'  => $count,
        ]);
    }
}
