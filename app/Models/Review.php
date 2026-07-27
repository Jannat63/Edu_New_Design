<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Review extends Model
{
    use SoftDeletes;

    protected $fillable = ['user_id', 'course_id', 'rating', 'body', 'is_visible'];
    protected $casts    = ['is_visible' => 'boolean'];

    public function user()   { return $this->belongsTo(User::class); }
    public function course() { return $this->belongsTo(Course::class); }

    protected static function booted(): void
    {
        // Auto-update course rating stats after save / delete
        static::saved(fn($r)   => $r->course->updateRatingStats());
        static::deleted(fn($r) => $r->course->updateRatingStats());
    }
}
