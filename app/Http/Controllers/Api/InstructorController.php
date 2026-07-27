<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Course;
use App\Models\Review;
use Illuminate\Http\Request;

class InstructorController extends Controller
{
    /** GET /api/v1/instructors — public list of all instructors */
    public function index(Request $request)
    {
        $instructors = User::whereHas('role', fn($q) => $q->where('slug', 'instructor'))
            ->where('is_active', true)
            ->where('is_banned', false)
            ->withCount('instructorCourses as courses_count')
            ->get();

        return response()->json($instructors->map(fn($i) => $this->cardPayload($i)));
    }

    /** GET /api/v1/instructors/{id} — public instructor profile */
    public function show(int $id)
    {
        $instructor = User::whereHas('role', fn($q) => $q->where('slug', 'instructor'))
            ->where('id', $id)
            ->firstOrFail();

        $courses = Course::published()
            ->where('instructor_id', $instructor->id)
            ->with('category:id,name,color')
            ->orderByDesc('total_students')
            ->get();

        $totalStudents = $courses->sum('total_students');
        $totalReviews  = $courses->sum('total_reviews');
        $avgRating     = $courses->where('total_reviews', '>', 0)->avg('average_rating') ?? 0;

        $recentReviews = Review::whereIn('course_id', $courses->pluck('id'))
            ->where('is_visible', true)
            ->with('user:id,name,avatar,city')
            ->orderByDesc('created_at')
            ->take(6)
            ->get();

        return response()->json([
            'id'         => $instructor->id,
            'name'       => $instructor->name,
            'avatar'     => $instructor->avatar_url,
            'bio'        => $instructor->bio,
            'city'       => $instructor->city,
            'stats' => [
                'total_courses'  => $courses->count(),
                'total_students' => $totalStudents,
                'total_reviews'  => $totalReviews,
                'rating'         => round($avgRating, 2),
            ],
            'courses' => $courses->map(fn($c) => [
                'id'             => $c->id,
                'title'          => $c->title,
                'slug'           => $c->slug,
                'thumbnail'      => $c->thumbnail_url,
                'category'       => $c->category?->name,
                'level'          => $c->level,
                'rating'         => (float) $c->average_rating,
                'total_reviews'  => $c->total_reviews,
                'total_students' => $c->total_students,
                'price'          => (float) $c->price,
                'discount_price' => $c->discount_price ? (float) $c->discount_price : null,
                'duration_minutes' => $c->total_duration_minutes,
            ]),
            'reviews' => $recentReviews->map(fn($r) => [
                'rating'     => $r->rating,
                'body'       => $r->body,
                'user'       => ['name' => $r->user?->name, 'avatar' => $r->user?->avatar_url, 'city' => $r->user?->city],
                'created_at' => $r->created_at->toDateString(),
            ]),
        ]);
    }

    // ── HELPER ────────────────────────────────────────────────────────────────
    private function cardPayload(User $i): array
    {
        $courses = Course::published()->where('instructor_id', $i->id)->get(['total_students','average_rating','total_reviews']);

        return [
            'id'             => $i->id,
            'name'           => $i->name,
            'avatar'         => $i->avatar_url,
            'bio'            => $i->bio,
            'city'           => $i->city,
            'courses_count'  => $i->courses_count ?? $courses->count(),
            'total_students' => $courses->sum('total_students'),
            'rating'         => round($courses->where('total_reviews','>',0)->avg('average_rating') ?? 0, 2),
        ];
    }

    /** GET /api/v1/instructors/{id}/courses */
    public function courses(int $id)
    {
        $instructor = \App\Models\User::findOrFail($id);

        $courses = \App\Models\Course::published()
            ->where('instructor_id', $instructor->id)
            ->withCount('enrollments as total_students')
            ->with('reviews:id,course_id,rating')
            ->orderByDesc('total_students')
            ->get()
            ->map(fn($c) => [
                'id'              => $c->id,
                'title'           => $c->title,
                'slug'            => $c->slug,
                'price'           => $c->price,
                'original_price'  => $c->original_price,
                'level'           => $c->level,
                'thumbnail_url'   => $c->thumbnail_url,
                'total_students'  => $c->total_students,
                'average_rating'  => $c->reviews->avg('rating') ? round($c->reviews->avg('rating'), 1) : 0,
                'total_reviews'   => $c->reviews->count(),
                'duration'        => $c->duration,
            ]);

        return response()->json($courses);
    }

}