<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Section;
use App\Models\Lesson;
use App\Models\Assignment;
use App\Services\BunnyStreamService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CourseCurriculumController extends Controller
{
    public function __construct(private BunnyStreamService $bunny) {}

    // ── GET CURRICULUM ────────────────────────────────────────────────────────

    /** GET /api/v1/admin/courses/{id}/curriculum  or  /instructor/courses/{id}/curriculum */
    public function show(int $courseId, Request $request)
    {
        $course = Course::findOrFail($courseId);
        $this->gate($course, $request->user());

        $sections = $course->sections()
            ->with(['lessons' => fn($q) => $q->with(['assignment', 'quiz'])->orderBy('sort_order')])
            ->orderBy('sort_order')
            ->get();

        return response()->json($sections->map(fn($s) => $this->sectionPayload($s)));
    }

    // ── SECTIONS ──────────────────────────────────────────────────────────────

    /** POST /api/v1/admin/courses/{id}/sections */
    public function storeSection(int $courseId, Request $request)
    {
        $course = Course::findOrFail($courseId);
        $this->gate($course, $request->user());

        $data = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'sort_order'  => 'nullable|integer|min:0',
        ]);

        $data['course_id']  = $course->id;
        $data['sort_order'] = $data['sort_order'] ?? ($course->sections()->max('sort_order') + 1);

        $section = Section::create($data);

        return response()->json(['message' => 'Section created.', 'section' => $this->sectionPayload($section->load('lessons'))], 201);
    }

    /** PUT /api/v1/admin/sections/{id} */
    public function updateSection(int $id, Request $request)
    {
        $section = Section::findOrFail($id);
        $this->gate($section->course, $request->user());

        $data = $request->validate([
            'title'       => 'sometimes|required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'sort_order'  => 'nullable|integer|min:0',
        ]);

        $section->update($data);

        return response()->json(['message' => 'Section updated.', 'section' => $this->sectionPayload($section->fresh()->load(['lessons.assignment']))]);
    }

    /** DELETE /api/v1/admin/sections/{id} */
    public function destroySection(int $id, Request $request)
    {
        $section = Section::findOrFail($id);
        $this->gate($section->course, $request->user());

        // Delete lesson video files
        foreach ($section->lessons as $lesson) {
            $this->cleanLessonFiles($lesson);
        }

        $section->delete();

        return response()->json(['message' => 'Section deleted.']);
    }

    /** POST /api/v1/admin/courses/{id}/sections/reorder — body: { ids:[3,1,2] } */
    public function reorderSections(int $courseId, Request $request)
    {
        $course = Course::findOrFail($courseId);
        $this->gate($course, $request->user());

        $request->validate(['ids' => 'required|array']);
        foreach ($request->ids as $order => $id) {
            Section::where('id', $id)->where('course_id', $course->id)->update(['sort_order' => $order]);
        }

        return response()->json(['message' => 'Sections reordered.']);
    }

    // ── LESSONS ───────────────────────────────────────────────────────────────

    /** POST /api/v1/admin/sections/{sectionId}/lessons */
    public function storeLesson(int $sectionId, Request $request)
    {
        $section = Section::findOrFail($sectionId);
        $this->gate($section->course, $request->user());

        $data = $this->validateLesson($request);
        $data['section_id'] = $section->id;
        $data['course_id']  = $section->course_id;
        $data['sort_order'] = $data['sort_order'] ?? ($section->lessons()->max('sort_order') + 1);

        $lesson = Lesson::create($data);

        // Create linked assignment record for assignment-type lessons
        if ($lesson->type === 'assignment') {
            $this->syncAssignment($lesson, $request);
        }

        // Create a companion Quiz record for quiz-type lessons — without this,
        // the lesson would show type='quiz' with nothing to actually take.
        if ($lesson->type === 'quiz') {
            $this->syncQuiz($lesson);
        }

        return response()->json([
            'message' => 'Lesson created.',
            'lesson'  => $this->lessonPayload($lesson->load(['assignment', 'quiz'])),
        ], 201);
    }

    /** PUT /api/v1/admin/lessons/{id} */
    public function updateLesson(int $id, Request $request)
    {
        $lesson = Lesson::findOrFail($id);
        $this->gate($lesson->section->course, $request->user());

        $data = $this->validateLesson($request);
        $lesson->update($data);

        if ($lesson->type === 'assignment') {
            $this->syncAssignment($lesson, $request);
        }
        if ($lesson->type === 'quiz') {
            $this->syncQuiz($lesson);
        }

        return response()->json([
            'message' => 'Lesson updated.',
            'lesson'  => $this->lessonPayload($lesson->fresh()->load(['assignment', 'quiz'])),
        ]);
    }

    /** DELETE /api/v1/admin/lessons/{id} */
    public function destroyLesson(int $id, Request $request)
    {
        $lesson = Lesson::findOrFail($id);
        $this->gate($lesson->section->course, $request->user());

        $this->cleanLessonFiles($lesson);
        $lesson->delete();

        return response()->json(['message' => 'Lesson deleted.']);
    }

    /** POST /api/v1/admin/sections/{sectionId}/lessons/reorder */
    public function reorderLessons(int $sectionId, Request $request)
    {
        $section = Section::findOrFail($sectionId);
        $this->gate($section->course, $request->user());

        $request->validate(['ids' => 'required|array']);
        foreach ($request->ids as $order => $id) {
            Lesson::where('id', $id)->where('section_id', $section->id)->update(['sort_order' => $order]);
        }

        return response()->json(['message' => 'Lessons reordered.']);
    }

    // ── HELPERS ───────────────────────────────────────────────────────────────

    /** Gate: admin passes always; instructor must own the course */
    private function gate(Course $course, $user): void
    {
        if ($user->isAdmin()) return;
        if ($user->isInstructor() && $course->instructor_id === $user->id) return;

        abort(403, 'You do not have permission to manage this course.');
    }

    private function validateLesson(Request $request): array
    {
        $data = $request->validate([
            'title'            => 'required|string|max:255',
            'type'             => 'required|in:video,text,resource,quiz,assignment',
            'video_url'        => 'nullable|string|max:500',
            'content'          => 'nullable|string',
            'duration_seconds' => 'nullable|integer|min:0',
            'is_preview'       => 'nullable|boolean',
            'available_at'     => 'nullable|date',
            'sort_order'       => 'nullable|integer|min:0',
        ]);

        // Lesson content is rendered as raw HTML on the frontend (rich-text
        // editor output), so it MUST be sanitized before it ever reaches the
        // database — this is the only place both storeLesson() and
        // updateLesson() funnel through. See app/Support/HtmlSanitizer.php.
        if (array_key_exists('content', $data)) {
            $data['content'] = \App\Support\HtmlSanitizer::clean($data['content']);
        }

        return $data;
    }

    private function syncAssignment(Lesson $lesson, Request $request): void
    {
        $aData = $request->validate([
            'assignment_title'       => 'nullable|string|max:255',
            'assignment_description' => 'nullable|string',
            'assignment_instructions'=> 'nullable|string',
            'assignment_max_score'   => 'nullable|integer|min:1|max:1000',
            'assignment_file_types'  => 'nullable|string|max:255',
            'assignment_max_file_mb' => 'nullable|integer|min:1|max:100',
        ]);

        Assignment::updateOrCreate(
            ['lesson_id' => $lesson->id],
            [
                'course_id'            => $lesson->course_id,
                'title'                => $aData['assignment_title'] ?? $lesson->title,
                'description'          => $aData['assignment_description'] ?? null,
                'instructions'         => $aData['assignment_instructions'] ?? null,
                'max_score'            => $aData['assignment_max_score'] ?? 100,
                'accepted_file_types'  => $aData['assignment_file_types'] ?? 'pdf,doc,docx,zip',
                'max_file_size_mb'     => $aData['assignment_max_file_mb'] ?? 10,
            ]
        );
    }

    private function syncQuiz(Lesson $lesson): void
    {
        \App\Models\Quiz::firstOrCreate(
            ['lesson_id' => $lesson->id],
            [
                'course_id'           => $lesson->course_id,
                'title'               => $lesson->title,
                'description'         => null,
                'pass_percentage'     => 70,
                'attempts_allowed'    => 3,
                'time_limit_minutes'  => null,
                'show_answers'        => true,
            ]
        );
    }
    private function cleanLessonFiles(Lesson $lesson): void
    {
        // Clean up uploaded submission files when a lesson is deleted
        if ($lesson->type === 'assignment' && $lesson->assignment) {
            foreach ($lesson->assignment->submissions as $sub) {
                if ($sub->file_path) Storage::disk('public')->delete($sub->file_path);
            }
        }

        // Clean up the remote Bunny Stream video, if this lesson had one —
        // this comment used to describe behavior that didn't actually exist
        // (see UPGRADE_PLAN.md Phase 3 item 7); fixed alongside adding the
        // upload feature itself, since a deleted lesson leaking an
        // indefinitely-billed remote video is the kind of thing that's easy
        // to not notice until a Bunny invoice is much bigger than expected.
        if ($lesson->video_provider_id) {
            $this->bunny->deleteVideo($lesson->video_provider_id);
        }
    }

    private function sectionPayload(Section $s): array
    {
        return [
            'id'          => $s->id,
            'title'       => $s->title,
            'description' => $s->description ?? null,
            'sort_order'  => $s->sort_order,
            'lessons'     => $s->lessons->map(fn($l) => $this->lessonPayload($l)),
        ];
    }

    private function lessonPayload(Lesson $l): array
    {
        $payload = [
            'id'               => $l->id,
            'title'            => $l->title,
            'type'             => $l->type,
            'video_url'        => $l->video_url,
            'content'          => $l->content,
            'duration_seconds' => $l->duration_seconds,
            'duration'         => $l->duration_formatted,
            'is_preview'       => (bool) $l->is_preview,
            'available_at'     => $l->available_at?->toISOString(),
            'sort_order'       => $l->sort_order,
            'assignment'       => null,
            'quiz_id'          => $l->type === 'quiz' && $l->relationLoaded('quiz') ? $l->quiz?->id : null,
        ];

        if ($l->type === 'assignment' && $l->relationLoaded('assignment') && $l->assignment) {
            $a = $l->assignment;
            $payload['assignment'] = [
                'id'                 => $a->id,
                'title'              => $a->title,
                'description'        => $a->description,
                'instructions'       => $a->instructions,
                'max_score'          => $a->max_score,
                'accepted_file_types'=> $a->accepted_file_types,
                'max_file_size_mb'   => $a->max_file_size_mb,
            ];
        }

        return $payload;
    }
}
