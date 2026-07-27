<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Coupon extends Model {
    protected $fillable = ['code','type','value','min_order','max_uses','used_count','course_id','user_id','is_active','expires_at'];
    protected $casts = ['is_active'=>'boolean','value'=>'float','min_order'=>'float','expires_at'=>'datetime'];
    public function course() { return $this->belongsTo(Course::class); }
    public function user()   { return $this->belongsTo(User::class); }
    public function isValid(?float $orderTotal = null): bool {
        if (!$this->is_active) return false;
        if ($this->expires_at && $this->expires_at->isPast()) return false;
        if ($this->max_uses && $this->used_count >= $this->max_uses) return false;
        // Only enforce the minimum-order threshold when an actual order
        // total is given. With the old default of 0, calling isValid() with
        // no argument (e.g. the admin coupon list's "is_valid" flag) would
        // incorrectly report false for any coupon with a min_order — the
        // coupon was never actually invalid, there just wasn't a real order
        // to check the minimum against.
        if ($orderTotal !== null && $orderTotal < $this->min_order) return false;
        return true;
    }
    public function apply(float $price): float {
        if ($this->type === 'percent') return max(0, $price - ($price * $this->value / 100));
        return max(0, $price - $this->value);
    }
    public function getDiscountAmountAttribute(): float {
        return 0; // computed at apply time
    }
}
