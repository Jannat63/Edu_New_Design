<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Payment extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id', 'course_id', 'bundle_id', 'amount', 'currency', 'gateway',
        'transaction_id', 'gateway_ref', 'status', 'gateway_response',
        'coupon_code', 'discount_amount', 'paid_at', 'refunded_at', 'reminder_sent_at',
    ];
    protected $casts = [
        'gateway_response'  => 'array',
        'amount'            => 'decimal:2',
        'discount_amount'   => 'decimal:2',
        'reminder_sent_at'  => 'datetime',
        'paid_at'          => 'datetime',
        'refunded_at'      => 'datetime',
    ];

    public function user()   { return $this->belongsTo(User::class); }
    public function course() { return $this->belongsTo(Course::class); }
    public function bundle() { return $this->belongsTo(Bundle::class); }

    public function scopePaid($q)  { return $q->where('status', 'paid'); }
    public function scopeToday($q) { return $q->whereDate('paid_at', today()); }
    public function scopeMonth($q) { return $q->whereMonth('paid_at', now()->month); }

    public function isPaid(): bool     { return $this->status === 'paid'; }
    public function isRefunded(): bool { return $this->status === 'refunded'; }
}
