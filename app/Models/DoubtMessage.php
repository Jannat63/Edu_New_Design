<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DoubtMessage extends Model
{
    const UPDATED_AT = null; // messages are immutable — no updated_at column

    protected $fillable = ['doubt_thread_id', 'role', 'content', 'grounded_in_transcript'];

    protected $casts = [
        'grounded_in_transcript' => 'boolean',
        'created_at'             => 'datetime',
    ];

    public function thread() { return $this->belongsTo(DoubtThread::class, 'doubt_thread_id'); }
}
