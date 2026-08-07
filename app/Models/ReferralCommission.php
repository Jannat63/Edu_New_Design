<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReferralCommission extends Model
{
    const UPDATED_AT = null; // append-only ledger entry, never edited

    protected $fillable = ['referrer_id', 'referred_user_id', 'payment_id', 'amount', 'rate_percent_at_time'];

    protected $casts = [
        'amount'               => 'decimal:2',
        'rate_percent_at_time' => 'decimal:2',
        'created_at'           => 'datetime',
    ];

    public function referrer()     { return $this->belongsTo(User::class, 'referrer_id'); }
    public function referredUser() { return $this->belongsTo(User::class, 'referred_user_id'); }
    public function payment()      { return $this->belongsTo(Payment::class); }
}
