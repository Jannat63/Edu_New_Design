<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Review;
use App\Models\Enrollment;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    /** GET /api/v1/courses/{slug}/reviews */
    public function index(string $slug, Request $request)
    {
        $course = Course::where('slug', $slug)->firstOrFail();

        $reviews = $course->reviews()
            ->with('user:id,name,avatar,city')
            ->orderByDesc('created_at')
            ->paginate($request->per_page ?? 10)
            ->through(fn($r) => [
                'id'         => $r->id,
                'rating'     => $r->rating,
                'body'       => $r->body,
                'user'       => ['id' => $r->user?->id, 'name' => $r->user?->name, 'avatar' => $r->user?->avatar_url, 'city' => $r->user?->city],
                'created_at' => $r->created_at->toDateString(),
            ]);

        $breakdown = [];
        for ($star = 5; $star >= 1; $star--) {
            $count = $course->reviews()->where('rating', $star)->count();
            $breakdown[$star] = [
                'count' => $count,
                'pct'   => $course->total_reviews > 0 ? round(($count / $course->total_reviews) * 100) : 0,
            ];
        }

        return response()->json([
            'average_rating' => (float) $course->average_rating,
            'total_reviews'  => $course->total_reviews,
            'breakdown'      => $breakdown,
            'reviews'        => $reviews,
        ]);
    }

    /** POST /api/v1/courses/{slug}/review — body: { rating, body } */
    public function store(string $slug, Request $request)
    {
        $data = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'body'   => 'nullable|string|max:2000',
        ]);

        $course = Course::where('slug', $slug)->firstOrFail();
        $user   = $request->user();

        $enrolled = Enrollment::where('user_id', $user->id)->where('course_id', $course->id)->exists();
        abort_unless($enrolled, 403, 'You must be enrolled in this course to leave a review.');

        $existing = Review::where('user_id', $user->id)->where('course_id', $course->id)->first();
        if ($existing) {
            return response()->json(['message' => 'You have already reviewed this course. Use PUT to update it.'], 409);
        }

        $review = Review::create([
            'user_id'   => $user->id,
            'course_id' => $course->id,
            'rating'    => $data['rating'],
            'body'      => $data['body'] ?? null,
        ]);

        return response()->json(['message' => 'Review submitted. Thank you!', 'review' => $review], 201);
    }

    /** PUT /api/v1/courses/{slug}/review */
    public function update(string $slug, Request $request)
    {
        $data = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'body'   => 'nullable|string|max:2000',
        ]);

        $course = Course::where('slug', $slug)->firstOrFail();
        $review = Review::where('user_id', $request->user()->id)->where('course_id', $course->id)->firstOrFail();

        $review->update($data);

        return response()->json(['message' => 'Review updated.', 'review' => $review->fresh()]);
    }

    /** DELETE /api/v1/courses/{slug}/review */
    public function destroy(string $slug, Request $request)
    {
        $course = Course::where('slug', $slug)->firstOrFail();
        $review = Review::where('user_id', $request->user()->id)->where('course_id', $course->id)->firstOrFail();
        $review->delete();

        return response()->json(['message' => 'Review removed.']);
    }
}
