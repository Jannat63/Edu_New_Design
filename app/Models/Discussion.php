<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
class Discussion extends Model {
    use SoftDeletes;
    protected $fillable = ['course_id','lesson_id','user_id','parent_id','body','is_pinned','is_solved','upvotes'];
    protected $casts = ['is_pinned'=>'boolean','is_solved'=>'boolean','upvotes'=>'integer'];
    public function user()    { return $this->belongsTo(User::class); }
    public function course()  { return $this->belongsTo(Course::class); }
    public function lesson()  { return $this->belongsTo(Lesson::class); }
    public function parent()  { return $this->belongsTo(Discussion::class,'parent_id'); }
    public function replies() { return $this->hasMany(Discussion::class,'parent_id')->with('user:id,name,avatar')->orderBy('created_at'); }
}
