<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Question extends Model
{
    protected $fillable = [
        'quiz_id', 'question_text', 'type',
        'explanation', 'points', 'sort_order',
    ];

    public function quiz()    { return $this->belongsTo(Quiz::class); }
    public function options() { return $this->hasMany(QuestionOption::class)->orderBy('sort_order'); }

    public function getCorrectOptionAttribute()
    {
        return $this->options()->where('is_correct', true)->first();
    }
}
