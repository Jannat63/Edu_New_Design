<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\LiveClass;
use App\Services\DailyCoService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class LiveClassController extends Controller
{
    public function __construct(private DailyCoService $daily) {}

    /** POST /instructor/courses/{courseId}/live-classes  (also mounted under /admin) */
    public function store(int $courseId, Request $request)
    {
        $course = Course::findOrFail($courseId);
        $this->gateCourse($course, $request->user());

        if (!$this->daily->isConfigured()) {
            return response()->json([
                'message' => 'Live classes aren\'t set up yet — an administrator needs to add DAILY_API_KEY and DAILY_DOMAIN.',
            ], 503);
        }

        $data = $request->validate([
            'title'            => 'required|string|max:255',
            'description'      => 'nullable|string|max:2000',
            'scheduled_at'     => 'required|date|after:now',
            'duration_minutes' => 'required|integer|min:15|max:480',
        ]);

        $roomName = 'edubd-' . Str::random(10);
        // A little slack past the class's own end time so nobody gets
        // ejected mid-sentence if it runs a few minutes over.
        $roomExpiresAt = \Illuminate\Support\Carbon::parse($data['scheduled_at'])
            ->addMinutes($data['duration_minutes'] + 30);

        try {
            $this->daily->createRoom($roomName, $roomExpiresAt);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }

        $liveClass = LiveClass::create([
            ...$data,
            'course_id'     => $course->id,
            'instructor_id' => $request->user()->id,
            'room_name'     => $roomName,
        ]);

        return response()->json(['message' => 'Live class scheduled.', 'live_class' => $this->payload($liveClass)], 201);
    }

    /** GET /instructor/courses/{courseId}/live-classes  (also mounted under /admin) */
    public function index(int $courseId, Request $request)
    {
        $course = Course::findOrFail($courseId);
        $this->gateCourse($course, $request->user());

        $classes = LiveClass::where('course_id', $courseId)->orderByDesc('scheduled_at')->get();

        return response()->json($classes->map(fn ($c) => $this->payload($c)));
    }

    /** DELETE /live-classes/{id} */
    public function destroy(int $id, Request $request)
    {
        $liveClass = LiveClass::with('course:id,instructor_id')->findOrFail($id);
        $this->gateCourse($liveClass->course, $request->user());

        $liveClass->update(['status' => 'cancelled']);
        $this->daily->deleteRoom($liveClass->room_name);

        return response()->json(['message' => 'Live class cancelled.']);
    }

    /** GET /live-classes/upcoming — student view, across all their enrolled courses */
    public function upcoming(Request $request)
    {
        $user = $request->user();
        $courseIds = Enrollment::where('user_id', $user->id)->pluck('course_id');

        $classes = LiveClass::whereIn('course_id', $courseIds)
            ->where('status', 'scheduled')
            ->where('scheduled_at', '>=', now()->subHours(4)) // still show ones that started recently, in case they're running long
            ->with('course:id,title')
            ->orderBy('scheduled_at')
            ->get();

        return response()->json($classes->map(fn ($c) => $this->payload($c)));
    }

    /** POST /live-classes/{id}/join */
    public function join(int $id, Request $request)
    {
        $liveClass = LiveClass::with('course:id,instructor_id')->findOrFail($id);
        $user = $request->user();

        $isInstructor = $user->isAdmin() || $liveClass->course->instructor_id === $user->id;
        $isEnrolled = Enrollment::where('user_id', $user->id)->where('course_id', $liveClass->course_id)->exists();

        if (!$isInstructor && !$isEnrolled) {
            return response()->json(['message' => 'You must be enrolled in this course to join its live classes.'], 403);
        }

        if ($liveClass->status !== 'scheduled') {
            return response()->json(['message' => 'This live class has been cancelled.'], 410);
        }

        if (now()->lt($liveClass->scheduled_at->clone()->subMinutes(10))) {
            return response()->json(['message' => 'This class hasn\'t started yet — the join button unlocks 10 minutes before the scheduled time.'], 425);
        }

        if ($liveClass->hasEnded()) {
            return response()->json(['message' => 'This live class has already ended.'], 410);
        }

        try {
            $token = $this->daily->createMeetingToken(
                $liveClass->room_name,
                $user->name,
                $isInstructor,
                $liveClass->endsAt()->addMinutes(15),
            );
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }

        return response()->json(['join_url' => $this->daily->joinUrl($liveClass->room_name, $token)]);
    }

    private function gateCourse(Course $course, $user): void
    {
        if ($user->isAdmin()) return;
        if ($user->isInstructor() && $course->instructor_id === $user->id) return;

        abort(403, 'You do not have permission to manage live classes for this course.');
    }

    private function payload(LiveClass $c): array
    {
        return [
            'id'               => $c->id,
            'title'            => $c->title,
            'description'      => $c->description,
            'scheduled_at'     => $c->scheduled_at->toIso8601String(),
            'duration_minutes' => $c->duration_minutes,
            'status'           => $c->status,
            'is_live_now'      => $c->isLiveNow(),
            'has_ended'        => $c->hasEnded(),
            'course'           => $c->relationLoaded('course') ? $c->course?->only('id', 'title') : null,
        ];
    }
}
