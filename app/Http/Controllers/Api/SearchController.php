<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\BlogPost;
use App\Models\User;
use Illuminate\Http\Request;
class SearchController extends Controller {
    public function search(Request $request) {
        $q = trim($request->input('q',''));
        if (strlen($q) < 2) return response()->json(['courses'=>[],'posts'=>[],'instructors'=>[]]);
        $courses = Course::published()
            ->where(fn($x) => $x->where('title','like',"%$q%")->orWhere('subtitle','like',"%$q%"))
            ->limit(6)->get()->map(fn($c) => [
                'id'=>$c->id,'title'=>$c->title,'slug'=>$c->slug,
                'price'=>$c->price,'thumbnail_url'=>$c->thumbnail_url,
            ]);
        $posts = BlogPost::published()
            ->where(fn($x) => $x->where('title','like',"%$q%")->orWhere('excerpt','like',"%$q%"))
            ->limit(4)->get()->map(fn($p) => [
                'id'=>$p->id,'title'=>$p->title,'slug'=>$p->slug,
            ]);
        $instructors = User::whereHas('role',fn($r) => $r->where('slug','instructor'))
            ->where('name','like',"%$q%")->limit(3)->get()
            ->map(fn($u) => ['id'=>$u->id,'name'=>$u->name,'avatar_url'=>$u->avatar_url]);
        return response()->json(compact('courses','posts','instructors'));
    }
}
