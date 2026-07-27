<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Bundle extends Model {
    protected $fillable = ['title','description','price','original_price','thumbnail','is_active'];
    protected $casts = ['is_active'=>'boolean','price'=>'float','original_price'=>'float'];
    public function courses() { return $this->belongsToMany(Course::class); }
    public function scopeActive($q) { return $q->where('is_active',true); }
    public function getThumbnailUrlAttribute(): ?string { return $this->thumbnail ? asset('storage/'.$this->thumbnail) : null; }
}
