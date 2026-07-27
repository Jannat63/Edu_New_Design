<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bundle;
use App\Models\Enrollment;
use Illuminate\Http\Request;

class BundleController extends Controller
{
    /** GET /api/v1/bundles */
    public function index()
    {
        return response()->json(
            Bundle::active()
                ->with('courses:id,title,price,thumbnail,slug')
                ->get()
                ->map(fn($b) => $this->summaryPayload($b))
        );
    }

    /** GET /api/v1/bundles/{id} */
    public function show(int $id, Request $request)
    {
        $bundle = Bundle::active()
            ->with(['courses' => function ($q) {
                $q->select('courses.id', 'courses.title', 'courses.slug', 'courses.price', 'courses.thumbnail',
                           'courses.average_rating', 'courses.total_students', 'courses.instructor_id')
                  ->with('instructor:id,name');
            }])
            ->findOrFail($id);

        $ownedCourseIds = collect();
        if ($request->user()) {
            $ownedCourseIds = Enrollment::where('user_id', $request->user()->id)
                ->whereIn('course_id', $bundle->courses->pluck('id'))
                ->pluck('course_id');
        }

        // Mirrors PaymentController::initiateBundle()'s proration exactly —
        // this is what the student would actually be charged right now,
        // shown up front rather than only revealed at checkout.
        $totalListPrice   = $bundle->courses->sum('price');
        $unownedListPrice = $bundle->courses->whereNotIn('id', $ownedCourseIds)->sum('price');
        $proration = $totalListPrice > 0 ? $unownedListPrice / $totalListPrice : 1;
        $payablePrice = round((float) $bundle->price * $proration, 2);

        return response()->json([
            'id'              => $bundle->id,
            'title'           => $bundle->title,
            'description'     => $bundle->description,
            'price'           => (float) $bundle->price,
            'payable_price'   => $payablePrice,
            'original_price'  => $bundle->original_price ? (float) $bundle->original_price : null,
            'thumbnail_url'   => $bundle->thumbnail_url,
            'courses'         => $bundle->courses->map(fn($c) => [
                'id'             => $c->id,
                'title'          => $c->title,
                'slug'           => $c->slug,
                'price'          => (float) $c->price,
                'thumbnail_url'  => $c->thumbnail_url,
                'rating'         => (float) $c->average_rating,
                'total_students' => $c->total_students,
                'instructor'     => $c->instructor?->name,
                'is_owned'       => $ownedCourseIds->contains($c->id),
            ]),
            'fully_owned'     => $request->user() ? $ownedCourseIds->count() === $bundle->courses->count() : false,
        ]);
    }

    private function summaryPayload(Bundle $b): array
    {
        return [
            'id'             => $b->id,
            'title'          => $b->title,
            'description'    => $b->description,
            'price'          => (float) $b->price,
            'original_price' => $b->original_price ? (float) $b->original_price : null,
            'thumbnail_url'  => $b->thumbnail_url,
            'course_count'   => $b->courses->count(),
            'courses'        => $b->courses->take(4)->map(fn($c) => [
                'id' => $c->id, 'title' => $c->title, 'price' => (float) $c->price,
                'thumbnail_url' => $c->thumbnail_url, 'slug' => $c->slug,
            ]),
        ];
    }
}
