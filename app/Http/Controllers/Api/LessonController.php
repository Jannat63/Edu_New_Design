<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Http\Request;

class LessonController extends Controller
{
    /** GET /api/v1/lessons/{id} */
    public function show(int $id, Request $request)
    {
        $lesson = Lesson::with(['course:id,title,slug,instructor_id', 'assignment:id,lesson_id'])->findOrFail($id);
        $user   = $request->user();

        $isOwnerOrAdmin = $user && ($user->isAdmin() || $lesson->course->instructor_id === $user->id);
        $enrolled = $user && Enrollment::where('user_id', $user->id)->where('course_id', $lesson->course_id)->exists();

        if (!$enrolled && !$lesson->is_preview && !$isOwnerOrAdmin) {
            return response()->json(['message' => 'You must enroll in this course to access this lesson.'], 403);
        }

        if ($lesson->isDripLockedFor($user)) {
            return response()->json([
                'message'      => 'This lesson isn\'t available yet.',
                'available_at' => $lesson->available_at->toISOString(),
            ], 403);
        }

        $progress = $user ? LessonProgress::where('user_id', $user->id)->where('lesson_id', $lesson->id)->first() : null;

        return response()->json([
            'id'               => $lesson->id,
            'title'            => $lesson->title,
            'type'             => $lesson->type,
            'video_url'        => $lesson->video_url,
            'video_thumbnail'  => $lesson->video_thumbnail,
            'duration_seconds' => $lesson->duration_seconds,
            'duration'         => $lesson->duration_formatted,
            'content'          => $lesson->content,
            'resources'        => $lesson->resources ?? [],
            'is_preview'       => (bool) $lesson->is_preview,
            'course'           => ['id' => $lesson->course->id, 'title' => $lesson->course->title, 'slug' => $lesson->course->slug],
            'progress'         => [
                'last_position_seconds' => $progress->last_position_seconds ?? 0,
                'is_completed'          => (bool) ($progress->is_completed ?? false),
            ],
            'has_quiz'      => $lesson->quiz()->exists(),
            'quiz_id'       => $lesson->quiz?->id,
            'assignment_id' => $lesson->type === 'assignment' ? $lesson->assignment?->id : null,
        ]);
    }

    /** POST /api/v1/lessons/{id}/progress  — body: { position_seconds } */
    public function updateProgress(int $id, Request $request)
    {
        $data = $request->validate(['position_seconds' => 'required|integer|min:0']);
        $lesson = Lesson::findOrFail($id);
        $user   = $request->user();

        $this->assertEnrolled($user->id, $lesson->course_id);

        $progress = LessonProgress::updateOrCreate(
            ['user_id' => $user->id, 'lesson_id' => $lesson->id],
            ['course_id' => $lesson->course_id, 'last_position_seconds' => $data['position_seconds']]
        );

        // Auto-complete if watched 90%+ of the video
        if ($lesson->duration_seconds > 0
            && $data['position_seconds'] >= $lesson->duration_seconds * 0.9
            && !$progress->is_completed
        ) {
            $this->completeLesson($progress, $user, $lesson->course_id);
        }

        return response()->json(['message' => 'Progress saved.', 'is_completed' => (bool) $progress->fresh()->is_completed]);
    }

    /** POST /api/v1/lessons/{id}/complete */
    public function markComplete(int $id, Request $request)
    {
        $lesson = Lesson::findOrFail($id);
        $user   = $request->user();

        $this->assertEnrolled($user->id, $lesson->course_id);

        $progress = LessonProgress::firstOrCreate(
            ['user_id' => $user->id, 'lesson_id' => $lesson->id],
            ['course_id' => $lesson->course_id]
        );

        $this->completeLesson($progress, $user, $lesson->course_id);

        $enrollment = Enrollment::where('user_id', $user->id)->where('course_id', $lesson->course_id)->first();

        return response()->json([
            'message'      => 'Lesson marked complete.',
            'progress_pct' => $enrollment?->progress_pct,
            'course_completed' => $enrollment?->isCompleted() ?? false,
        ]);
    }

    /** GET /api/v1/lessons/{id}/resources */
    public function resources(int $id, Request $request)
    {
        $lesson = Lesson::findOrFail($id);
        $this->assertEnrolled($request->user()->id, $lesson->course_id, allowPreview: $lesson->is_preview);

        return response()->json(['resources' => $lesson->resources ?? []]);
    }

    // ── HELPERS ───────────────────────────────────────────────────────────────
    private function assertEnrolled(int $userId, int $courseId, bool $allowPreview = false): void
    {
        if ($allowPreview) return;

        $enrolled = Enrollment::where('user_id', $userId)->where('course_id', $courseId)->exists();
        abort_unless($enrolled, 403, 'You must enroll in this course first.');
    }

    private function completeLesson(LessonProgress $progress, User $user, int $courseId): void
    {
        if (!$progress->is_completed) {
            $progress->update(['is_completed' => true, 'completed_at' => now()]);
            app(\App\Services\GamificationService::class)->recordActivity($user);
        }

        $enrollment = Enrollment::where('user_id', $user->id)->where('course_id', $courseId)->first();
        $enrollment?->recalculateProgress();
    }
}
