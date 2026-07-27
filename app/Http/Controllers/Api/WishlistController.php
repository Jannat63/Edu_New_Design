<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Wishlist;
use Illuminate\Http\Request;
class WishlistController extends Controller {
    public function index(Request $request) {
        $items = Wishlist::where('user_id',$request->user()->id)
            ->with(['course:id,title,slug,price,original_price,thumbnail,level'])
            ->get()->map(fn($w) => [
                'id' => $w->id,
                'course' => [
                    'id'=>$w->course->id,'title'=>$w->course->title,'slug'=>$w->course->slug,
                    'price'=>$w->course->price,'original_price'=>$w->course->original_price,
                    'thumbnail_url'=>$w->course->thumbnail_url,'level'=>$w->course->level,
                ],
            ]);
        return response()->json($items);
    }
    public function toggle(int $courseId, Request $request) {
        $userId = $request->user()->id;
        $existing = Wishlist::where('user_id',$userId)->where('course_id',$courseId)->first();
        if ($existing) { $existing->delete(); return response()->json(['wishlisted'=>false,'message'=>'Removed from wishlist.']); }
        Wishlist::create(['user_id'=>$userId,'course_id'=>$courseId]);
        return response()->json(['wishlisted'=>true,'message'=>'Added to wishlist!']);
    }
    public function check(int $courseId, Request $request) {
        $wishlisted = Wishlist::where('user_id',$request->user()->id)->where('course_id',$courseId)->exists();
        return response()->json(['wishlisted'=>$wishlisted]);
    }
}
