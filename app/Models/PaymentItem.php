<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentItem extends Model
{
    protected $fillable = ['payment_id', 'course_id', 'bundle_id', 'amount'];

    protected $casts = ['amount' => 'decimal:2'];

    public function payment() { return $this->belongsTo(Payment::class); }
    public function course()  { return $this->belongsTo(Course::class); }
    public function bundle()  { return $this->belongsTo(Bundle::class); }
}
