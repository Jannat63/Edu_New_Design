<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Certificate extends Model
{
    protected $fillable = ['user_id', 'course_id', 'cert_code', 'pdf_path', 'issued_at'];
    protected $casts    = ['issued_at' => 'datetime'];

    public function user()   { return $this->belongsTo(User::class); }
    public function course() { return $this->belongsTo(Course::class); }

    public function getPdfUrlAttribute(): ?string
    {
        return $this->pdf_path ? asset('storage/' . $this->pdf_path) : null;
    }

    public static function generateCode(): string
    {
        return 'EDU-' . date('Y') . '-' . strtoupper(Str::random(6));
    }
}
