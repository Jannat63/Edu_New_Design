<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class AdminCourseController extends Controller
{
    /** GET /api/v1/admin/courses */
    public function index(Request $request)
    {
        $courses = Course::with(['category:id,name', 'instructor:id,name'])
            ->when($request->status,   fn($q, $s)   => $q->where('status', $s))
            ->when($request->category, fn($q, $cat) => $q->where('category_id', $cat))
            ->when($request->search,   fn($q, $s)   => $q->where('title', 'like', "%{$s}%"))
            ->orderByDesc('created_at')
            ->paginate($request->per_page ?? 20)
            ->through(fn($c) => [
                'id'             => $c->id,
                'title'          => $c->title,
                'slug'           => $c->slug,
                'category'       => $c->category?->name,
                'instructor'     => $c->instructor?->name,
                'price'          => (float) $c->price,
                'discount_price' => $c->discount_price ? (float) $c->discount_price : null,
                'status'         => $c->status,
                'total_students' => $c->total_students,
                'average_rating' => (float) $c->average_rating,
                'created_at'     => $c->created_at->toDateString(),
            ]);

        return response()->json($courses);
    }

    /** GET /api/v1/admin/courses/{id} */
    public function show(int $id)
    {
        $course = Course::with(['category', 'instructor:id,name,email', 'sections.lessons'])->findOrFail($id);
        return response()->json($course);
    }

    /** POST /api/v1/admin/courses */
    public function store(Request $request)
    {
        $data = $this->validated($request);

        $data['slug'] = $this->uniqueSlug($data['title']);

        if ($request->hasFile('thumbnail')) {
            $data['thumbnail'] = $request->file('thumbnail')->store('courses/thumbnails', 'public');
        }
        if ($request->hasFile('og_image')) {
            $data['og_image'] = $request->file('og_image')->store('courses/og-images', 'public');
        }

        $course = Course::create($data);

        return response()->json(['message' => 'Course created.', 'course' => $course], 201);
    }

    /** PUT /api/v1/admin/courses/{id} */
    public function update(int $id, Request $request)
    {
        $course = Course::findOrFail($id);
        $data   = $this->validated($request, $course->id);

        if (isset($data['title']) && $data['title'] !== $course->title) {
            $data['slug'] = $this->uniqueSlug($data['title'], $course->id);
        }

        if ($request->hasFile('thumbnail')) {
            if ($course->thumbnail) Storage::disk('public')->delete($course->thumbnail);
            $data['thumbnail'] = $request->file('thumbnail')->store('courses/thumbnails', 'public');
        }
        if ($request->hasFile('og_image')) {
            if ($course->og_image) Storage::disk('public')->delete($course->og_image);
            $data['og_image'] = $request->file('og_image')->store('courses/og-images', 'public');
        }

        $course->update($data);

        return response()->json(['message' => 'Course updated.', 'course' => $course->fresh()]);
    }

    /** DELETE /api/v1/admin/courses/{id} */
    public function destroy(int $id)
    {
        $course = Course::findOrFail($id);

        if ($course->thumbnail) Storage::disk('public')->delete($course->thumbnail);
        if ($course->og_image) Storage::disk('public')->delete($course->og_image);
        $course->delete(); // soft delete

        return response()->json(['message' => 'Course deleted.']);
    }

    /** POST /api/v1/admin/courses/{id}/publish — body: { status: published|draft|archived } */
    public function publish(int $id, Request $request)
    {
        $data = $request->validate(['status' => 'required|in:draft,published,archived']);

        $course = Course::findOrFail($id);
        $course->update(['status' => $data['status']]);

        return response()->json(['message' => "Course status set to {$data['status']}.", 'status' => $course->status]);
    }

    // ── HELPERS ───────────────────────────────────────────────────────────────
    private function validated(Request $request, ?int $ignoreId = null): array
    {
        return $request->validate([
            'title'            => 'sometimes|required|string|max:255',
            'subtitle'         => 'nullable|string|max:500',
            'description'      => 'nullable|string',
            'category_id'      => 'sometimes|required|exists:categories,id',
            'instructor_id'    => ['sometimes', 'required', 'exists:users,id', function ($attr, $value, $fail) {
                $user = User::find($value);
                if ($user && !$user->isInstructor() && !$user->isAdmin()) {
                    $fail('Selected user is not an instructor.');
                }
            }],
            'language'         => 'nullable|string|max:50',
            'level'            => 'nullable|in:Beginner,Intermediate,Advanced,All Levels',
            'price'            => 'nullable|numeric|min:0',
            'discount_price'   => 'nullable|numeric|min:0',
            'status'           => 'nullable|in:draft,published,archived',
            'requirements'     => 'nullable|array',
            'what_you_learn'   => 'nullable|array',
            'faqs'             => 'nullable|array',
            'faqs.*.question'  => 'required_with:faqs|string|max:255',
            'faqs.*.answer'    => 'required_with:faqs|string|max:2000',
            'meta_title'       => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:500',
            'thumbnail'        => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'og_image'         => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);
    }

    private function uniqueSlug(string $title, ?int $ignoreId = null): string
    {
        $base = Str::slug($title);
        $slug = $base;
        $i = 1;

        while (Course::where('slug', $slug)->when($ignoreId, fn($q) => $q->where('id', '!=', $ignoreId))->exists()) {
            $slug = "{$base}-" . ++$i;
        }

        return $slug;
    }

    /**
     * POST /api/v1/instructor/courses
     * Instructors create their own courses — auto-assigns instructor_id.
     */
    public function instructorStore(Request $request)
    {
        // This route only requires auth:sanctum at the routing layer (see
        // routes/api.php) — every other /instructor/* controller enforces the
        // actual "and is this user really an instructor" check itself, via the
        // same isInstructor()-or-isAdmin() pattern as CourseCurriculumController's
        // gate(). This one was missing it, which meant any logged-in account —
        // student role included — could create (and, since 'status' below is a
        // client-settable field, directly publish) a course with themselves as
        // instructor_id.
        if (!$request->user()->isInstructor() && !$request->user()->isAdmin()) {
            abort(403, 'Instructor access only.');
        }

        $data = $request->validate([
            'title'       => 'required|string|max:255',
            'subtitle'    => 'nullable|string|max:500',
            'description' => 'nullable|string',
            'price'       => 'required|numeric|min:0',
            'level'       => 'nullable|in:Beginner,Intermediate,Advanced,All Levels',
            'status'      => 'nullable|in:draft,published,archived',
        ]);

        $data['instructor_id'] = $request->user()->id;
        $data['slug']          = \Illuminate\Support\Str::slug($data['title']) . '-' . uniqid();
        $data['status']        = $data['status'] ?? 'draft';

        $course = \App\Models\Course::create($data);

        return response()->json([
            'message' => 'Course created successfully.',
            'course'  => [
                'id'            => $course->id,
                'title'         => $course->title,
                'slug'          => $course->slug,
                'status'        => $course->status,
                'price'         => $course->price,
                'total_students'=> 0,
            ],
        ], 201);
    }

}