<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DoubtThread extends Model
{
    protected $fillable = ['user_id', 'lesson_id'];

    public function user()     { return $this->belongsTo(User::class); }
    public function lesson()   { return $this->belongsTo(Lesson::class); }
    public function messages() { return $this->hasMany(DoubtMessage::class)->orderBy('created_at'); }
}
