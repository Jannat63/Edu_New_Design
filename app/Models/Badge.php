<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Badge extends Model
{
    public $timestamps = false;

    protected $fillable = ['key', 'name', 'description', 'icon', 'criteria_type', 'criteria_value', 'sort_order'];

    public function users() { return $this->belongsToMany(User::class, 'user_badges')->withPivot('earned_at'); }
}
