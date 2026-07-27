<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Payout extends Model {
    protected $fillable = ['instructor_id','amount','method','account_number','status','note','paid_at','processed_by'];
    protected $casts = ['amount'=>'float','paid_at'=>'datetime'];
    public function instructor()  { return $this->belongsTo(User::class,'instructor_id'); }
    public function processedBy() { return $this->belongsTo(User::class,'processed_by'); }
}
