<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Category;
use App\Models\Enrollment;
use Illuminate\Http\Request;
use App\Notifications\CourseEnrolled;

class CourseController extends Controller
{
    // ── LIST WITH FILTERS ─────────────────────────────────────────────────────
    /**
     * GET /api/v1/courses
     * Query params: search, category, level, language, min_rating,
     *                price (all|under1k|1k2k|above2k), sort, per_page
     */
    public function index(Request $request)
    {
        $courses = Course::published()
            ->with(['category:id,name,slug,color', 'instructor:id,name,avatar'])
            ->when($request->search, fn($q, $s) =>
                $q->where(function ($q) use ($s) {
                    $q->where('title', 'like', "%{$s}%")
                      ->orWhereHas('instructor', fn($q) => $q->where('name', 'like', "%{$s}%"));
                }))
            ->when($request->category, fn($q, $cat) =>
                $q->whereHas('category', fn($q) => $q->where('slug', $cat)))
            ->when($request->level, fn($q, $lvl) => $q->where('level', $lvl))
            ->when($request->language, fn($q, $lang) => $q->where('language', $lang))
            ->when($request->min_rating, fn($q, $r) => $q->where('average_rating', '>=', $r))
            ->when($request->price, function ($q, $price) {
                return match ($price) {
                    'under1k' => $q->whereRaw('COALESCE(discount_price, price) < 1000'),
                    '1k2k'    => $q->whereRaw('COALESCE(discount_price, price) BETWEEN 1000 AND 2000'),
                    'above2k' => $q->whereRaw('COALESCE(discount_price, price) > 2000'),
                    default   => $q,
                };
            })
            ->when($request->sort, function ($q, $sort) {
                return match ($sort) {
                    'rating'  => $q->orderByDesc('average_rating'),
                    'newest'  => $q->orderByDesc('created_at'),
                    'priceLo' => $q->orderByRaw('COALESCE(discount_price, price) ASC'),
                    'priceHi' => $q->orderByRaw('COALESCE(discount_price, price) DESC'),
                    default   => $q->orderByDesc('total_students'), // popular
                };
            }, fn($q) => $q->orderByDesc('total_students'))
            ->paginate($request->per_page ?? 12)
            ->through(fn($c) => $this->cardPayload($c));

        return response()->json($courses);
    }

    // ── BY CATEGORY ───────────────────────────────────────────────────────────
    /** GET /api/v1/courses/category/{slug} */
    public function byCategory(string $slug, Request $request)
    {
        $category = Category::where('slug', $slug)->firstOrFail();

        $courses = Course::published()
            ->where('category_id', $category->id)
            ->with(['category:id,name,slug,color', 'instructor:id,name,avatar'])
            ->orderByDesc('total_students')
            ->paginate($request->per_page ?? 12)
            ->through(fn($c) => $this->cardPayload($c));

        return response()->json([
            'category' => ['name' => $category->name, 'slug' => $category->slug],
            'courses'  => $courses,
        ]);
    }

    // ── DETAIL ────────────────────────────────────────────────────────────────
    /** GET /api/v1/courses/{slug} */
    public function show(string $slug, Request $request)
    {
        $course = Course::where('slug', $slug)
            ->with(['category:id,name,slug,color', 'instructor:id,name,avatar,bio'])
            ->firstOrFail();

        $isEnrolled = false;
        $progress   = null;

        if ($request->user()) {
            $enrollment = Enrollment::where('user_id', $request->user()->id)
                ->where('course_id', $course->id)
                ->first();
            $isEnrolled = (bool) $enrollment;
            $progress   = $enrollment?->progress_pct;
        }

        return response()->json([
            'id'              => $course->id,
            'title'           => $course->title,
            'slug'            => $course->slug,
            'subtitle'        => $course->subtitle,
            'description'     => $course->description,
            'thumbnail'       => $course->thumbnail_url,
            'preview_video'   => $course->preview_video,
            'language'        => $course->language,
            'level'           => $course->level,
            'price'           => (float) $course->price,
            'discount_price'  => $course->discount_price ? (float) $course->discount_price : null,
            'effective_price' => (float) $course->effective_price,
            'discount_pct'    => $course->discount_percentage,
            'rating'          => (float) $course->average_rating,
            'total_reviews'   => $course->total_reviews,
            'total_students'  => $course->total_students,
            'total_lessons'   => $course->total_lessons,
            'total_duration_minutes' => $course->total_duration_minutes,
            'requirements'    => $course->requirements ?? [],
            'what_you_learn'  => $course->what_you_learn ?? [],
            'faqs'            => $course->faqs ?? [],
            'category'        => ['name' => $course->category?->name, 'slug' => $course->category?->slug],
            'instructor'      => [
                'id'     => $course->instructor?->id,
                'name'   => $course->instructor?->name,
                'avatar' => $course->instructor?->avatar_url,
                'bio'    => $course->instructor?->bio,
            ],
            'is_enrolled' => $isEnrolled,
            'progress_pct'=> $progress,
            'meta_title'  => $course->meta_title,
            'meta_description' => $course->meta_description,
            'og_image'    => $course->og_image_url,
            // Phase 6 item 19, UPGRADE_PLAN.md — course pages had none of the
            // standard marketplace conversion patterns (FAQ covered above;
            // these two are the "why should I trust this purchase" pieces).
            'related_courses'          => $this->relatedCourses($course),
            'instructor_other_courses' => $this->instructorOtherCourses($course),
        ]);
    }

    /** Other published courses in the same category — "students also browse" */
    private function relatedCourses(Course $course): array
    {
        return Course::published()
            ->where('id', '!=', $course->id)
            ->where('category_id', $course->category_id)
            ->orderByDesc('average_rating')
            ->orderByDesc('total_students')
            ->limit(4)
            ->get(['id', 'title', 'slug', 'thumbnail', 'price', 'discount_price', 'average_rating', 'total_students'])
            ->map(fn($c) => [
                'id' => $c->id, 'title' => $c->title, 'slug' => $c->slug,
                'thumbnail' => $c->thumbnail_url, 'price' => (float) $c->price,
                'effective_price' => (float) $c->effective_price,
                'rating' => (float) $c->average_rating, 'total_students' => $c->total_students,
            ])->toArray();
    }

    /** This instructor's other published courses — cross-promotion, uses the
     *  instructorCourses() relationship that already existed on User but
     *  wasn't surfaced anywhere on the course page itself. */
    private function instructorOtherCourses(Course $course): array
    {
        if (!$course->instructor_id) return [];

        return Course::published()
            ->where('id', '!=', $course->id)
            ->where('instructor_id', $course->instructor_id)
            ->orderByDesc('total_students')
            ->limit(4)
            ->get(['id', 'title', 'slug', 'thumbnail', 'price', 'discount_price', 'average_rating', 'total_students'])
            ->map(fn($c) => [
                'id' => $c->id, 'title' => $c->title, 'slug' => $c->slug,
                'thumbnail' => $c->thumbnail_url, 'price' => (float) $c->price,
                'effective_price' => (float) $c->effective_price,
                'rating' => (float) $c->average_rating, 'total_students' => $c->total_students,
            ])->toArray();
    }

    // ── CURRICULUM ────────────────────────────────────────────────────────────
    /** GET /api/v1/courses/{slug}/lessons */
    public function lessons(string $slug, Request $request)
    {
        $course = Course::where('slug', $slug)->firstOrFail();

        $isEnrolled = $request->user()
            ? Enrollment::where('user_id', $request->user()->id)->where('course_id', $course->id)->exists()
            : false;

        // Course owner/admin bypass content-drip locks so they can preview
        // scheduled content before it's released to students. Computed once
        // here (not per-lesson) to avoid an N+1 lazy-load of ->course on
        // every lesson in isDripLockedFor().
        $isOwnerOrAdmin = $request->user()
            && ($request->user()->isAdmin() || $course->instructor_id === $request->user()->id);

        $sections = $course->sections()->with(['lessons' => fn($q) => $q->with('assignment:id,lesson_id')->orderBy('sort_order')])->get();

        $completedIds = [];
        if ($request->user()) {
            $completedIds = \App\Models\LessonProgress::where('user_id', $request->user()->id)
                ->where('course_id', $course->id)
                ->where('is_completed', true)
                ->pluck('lesson_id')
                ->toArray();
        }

        return response()->json([
            'is_enrolled' => $isEnrolled,
            'sections'    => $sections->map(function ($sec) use ($completedIds, $isEnrolled, $isOwnerOrAdmin) {
                return [
                    'id'       => $sec->id,
                    'title'    => $sec->title,
                    'duration' => $sec->total_duration,
                    'lessons'  => $sec->lessons->map(function ($l) use ($completedIds, $isEnrolled, $isOwnerOrAdmin) {
                        $dripLocked = !$isOwnerOrAdmin && $l->available_at && now()->lt($l->available_at);
                        $unlocked = ($l->is_preview || $isEnrolled) && !$dripLocked;

                        return [
                            'id'                => $l->id,
                            'title'             => $l->title,
                            'type'              => $l->type,
                            'duration'          => $l->duration_formatted,
                            'duration_seconds'  => $l->duration_seconds,
                            'is_preview'        => (bool) $l->is_preview,
                            'is_completed'      => in_array($l->id, $completedIds),
                            // Only expose video URL if free preview, enrolled, or admin — AND not drip-locked.
                            'video_url'         => $unlocked ? $l->video_url : null,
                            'locked'            => !$l->is_preview && !$isEnrolled,
                            'drip_locked'       => $dripLocked,
                            'available_at'      => $l->available_at?->toISOString(),
                            'assignment_id'     => $l->type === 'assignment' ? $l->assignment?->id : null,
                        ];
                    }),
                ];
            }),
        ]);
    }

    // ── ENROLL ────────────────────────────────────────────────────────────────
    /** POST /api/v1/courses/{slug}/enroll */
    public function enroll(string $slug, Request $request)
    {
        $course = Course::where('slug', $slug)->where('status', 'published')->firstOrFail();
        $user   = $request->user();

        $existing = Enrollment::where('user_id', $user->id)->where('course_id', $course->id)->first();
        if ($existing) {
            return response()->json(['message' => 'Already enrolled.', 'enrollment' => $existing], 200);
        }

        $price = $course->effective_price;

        // Free course → enroll immediately
        if ($price <= 0) {
            $enrollment = Enrollment::create([
                'user_id'     => $user->id,
                'course_id'   => $course->id,
                'amount_paid' => 0,
                'enrolled_at' => now(),
            ]);
            $course->increment('total_students');

            $request->user()->notify(new CourseEnrolled($course->title, $course->slug));
        return response()->json(['message' => 'Enrolled successfully.', 'enrollment' => $enrollment], 201);
        }

        // Paid course → must go through PaymentController::initiate
        return response()->json([
            'message'  => 'This course requires payment. Please complete checkout.',
            'price'    => $price,
            'checkout' => '/api/v1/payments/initiate',
        ], 402);
    }

    // ── MY COURSES (student dashboard) ───────────────────────────────────────
    /** GET /api/v1/dashboard/my-courses */
    public function myCourses(Request $request)
    {
        $enrollments = Enrollment::where('user_id', $request->user()->id)
            ->with(['course:id,title,slug,thumbnail,total_lessons,category_id', 'course.category:id,name,color'])
            ->orderByDesc('updated_at')
            ->get();

        return response()->json($enrollments->map(fn($e) => [
            'enrollment_id'  => $e->id,
            'course_id'      => $e->course_id,
            'title'          => $e->course?->title,
            'slug'           => $e->course?->slug,
            'thumbnail'      => $e->course?->thumbnail ? asset('storage/'.$e->course->thumbnail) : null,
            'category'       => $e->course?->category?->name,
            'progress_pct'   => $e->progress_pct,
            'completed_lessons' => $e->completed_lessons,
            'total_lessons'  => $e->course?->total_lessons,
            'is_completed'   => $e->isCompleted(),
            'enrolled_at'    => $e->enrolled_at?->toDateString(),
            'completed_at'   => $e->completed_at?->toDateString(),
        ]));
    }

    // ── HELPER ────────────────────────────────────────────────────────────────
    private function cardPayload(Course $c): array
    {
        return [
            'id'              => $c->id,
            'title'           => $c->title,
            'slug'            => $c->slug,
            'thumbnail'       => $c->thumbnail_url,
            'category'        => ['name' => $c->category?->name, 'slug' => $c->category?->slug, 'color' => $c->category?->color],
            'instructor'      => ['name' => $c->instructor?->name, 'avatar' => $c->instructor?->avatar_url],
            'level'           => $c->level,
            'language'        => $c->language,
            'rating'          => (float) $c->average_rating,
            'total_reviews'   => $c->total_reviews,
            'total_students'  => $c->total_students,
            'total_duration_minutes' => $c->total_duration_minutes,
            'price'           => (float) $c->price,
            'discount_price'  => $c->discount_price ? (float) $c->discount_price : null,
            'discount_pct'    => $c->discount_percentage,
        ];
    }
}
