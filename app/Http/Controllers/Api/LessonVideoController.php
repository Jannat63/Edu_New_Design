<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Services\BunnyStreamService;
use Illuminate\Http\Request;

/**
 * Instructor-facing video upload for a lesson (Phase 3 item 7). The actual
 * file bytes go straight from the browser to Bunny (see BunnyStreamService
 * for why); this controller only ever handles small JSON requests. Mounted
 * under both /admin/lessons/{id}/video/* and /instructor/lessons/{id}/video/*
 * — same gate() pattern as CourseCurriculumController, which this
 * deliberately mirrors rather than sharing a base class with, to keep the
 * existing curriculum controller's diff untouched.
 */
class LessonVideoController extends Controller
{
    public function __construct(private BunnyStreamService $bunny) {}

    /** POST /lessons/{id}/video/init — creates the remote video, returns signed upload credentials. */
    public function init(int $id, Request $request)
    {
        $lesson = Lesson::with('course:id,instructor_id')->findOrFail($id);
        $this->gate($lesson, $request->user());

        if (!$this->bunny->isConfigured()) {
            return response()->json([
                'message' => 'Video upload isn\'t set up yet — an administrator needs to add BUNNY_API_KEY and BUNNY_LIBRARY_ID. You can still paste a video URL directly below.',
            ], 503);
        }

        // Replacing an existing video: best-effort delete the old remote
        // file so it doesn't sit in the Bunny library forever running up
        // storage cost. Not blocking — if this fails we still proceed with
        // creating the new one.
        if ($lesson->video_provider_id) {
            $this->bunny->deleteVideo($lesson->video_provider_id);
        }

        try {
            $guid = $this->bunny->createVideo($lesson->title);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }

        $lesson->update(['video_provider_id' => $guid, 'video_status' => 'uploading']);

        return response()->json($this->bunny->signUpload($guid));
    }

    /**
     * GET /lessons/{id}/video/status — polled by the instructor's browser
     * while Bunny transcodes. Updates the lesson once Bunny reports it's
     * ready, so video_url ends up populated without any further action from
     * the frontend (robust to the instructor closing the tab mid-processing
     * and checking back later).
     */
    public function status(int $id, Request $request)
    {
        $lesson = Lesson::with('course:id,instructor_id')->findOrFail($id);
        $this->gate($lesson, $request->user());

        if (!$lesson->video_provider_id) {
            return response()->json(['status' => 'none']);
        }

        if ($lesson->video_status === 'ready') {
            return response()->json([
                'status'    => 'ready',
                'video_url' => $lesson->video_url,
                'thumbnail' => $this->bunny->thumbnailUrl($lesson->video_provider_id),
            ]);
        }

        try {
            $result = $this->bunny->checkStatus($lesson->video_provider_id);
        } catch (\RuntimeException $e) {
            return response()->json(['status' => 'processing', 'message' => $e->getMessage()]);
        }

        if ($result['ready']) {
            $lesson->update([
                'video_status'     => 'ready',
                'video_url'        => $result['playback_url'],
                'video_thumbnail'  => $result['thumbnail_url'],
                'duration_seconds' => $result['duration_seconds'] ?? $lesson->duration_seconds,
            ]);

            return response()->json(['status' => 'ready', 'video_url' => $result['playback_url'], 'thumbnail' => $result['thumbnail_url']]);
        }

        if ($result['failed']) {
            $lesson->update(['video_status' => 'error']);
            return response()->json(['status' => 'error', 'message' => 'Bunny reported a processing error for this video. Try uploading again.']);
        }

        return response()->json(['status' => 'processing']);
    }

    private function gate(Lesson $lesson, $user): void
    {
        if ($user->isAdmin()) return;
        if ($user->isInstructor() && $lesson->course->instructor_id === $user->id) return;

        abort(403, 'You do not have permission to manage this lesson.');
    }
}
