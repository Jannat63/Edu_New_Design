<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReferralPayout extends Model
{
    protected $fillable = ['user_id', 'amount', 'method', 'account_number', 'status', 'note', 'paid_at', 'processed_by'];

    protected $casts = [
        'amount'  => 'decimal:2',
        'paid_at' => 'datetime',
    ];

    public function user()        { return $this->belongsTo(User::class); }
    public function processedBy() { return $this->belongsTo(User::class, 'processed_by'); }
}
