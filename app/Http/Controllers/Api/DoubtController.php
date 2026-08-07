<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DoubtMessage;
use App\Models\DoubtThread;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Services\AnthropicDoubtAssistant;
use Illuminate\Http\Request;

class DoubtController extends Controller
{
    // Daily cap per student, across all lessons — protects against runaway
    // API cost from a single account, not a precision abuse defense (the
    // route-level throttle:20,1 in routes/api.php handles burst spam).
    private const DAILY_MESSAGE_CAP = 40;

    /** GET /api/v1/lessons/{id}/doubts */
    public function show(int $id, Request $request)
    {
        $lesson = Lesson::with('course:id,title,instructor_id')->findOrFail($id);
        $user = $request->user();

        if (!$this->canAsk($lesson, $user)) {
            return response()->json(['message' => 'You must enroll in this course to use the doubt-solving assistant.'], 403);
        }

        $thread = DoubtThread::where('user_id', $user->id)->where('lesson_id', $lesson->id)->first();

        return response()->json([
            'messages'   => $thread ? $thread->messages->map(fn ($m) => $this->formatMessage($m)) : [],
            'remaining_today' => max(0, self::DAILY_MESSAGE_CAP - $this->todaysMessageCount($user->id)),
        ]);
    }

    /** POST /api/v1/lessons/{id}/doubts  — body: { question: string } */
    public function ask(int $id, Request $request, AnthropicDoubtAssistant $assistant)
    {
        $data = $request->validate(['question' => 'required|string|min:2|max:2000']);

        $lesson = Lesson::with('course:id,title,description,what_you_learn,instructor_id')->findOrFail($id);
        $user = $request->user();

        if (!$this->canAsk($lesson, $user)) {
            return response()->json(['message' => 'You must enroll in this course to use the doubt-solving assistant.'], 403);
        }

        if (!$assistant->isConfigured()) {
            return response()->json([
                'message' => 'The doubt-solving assistant isn\'t set up yet — an administrator needs to add an ANTHROPIC_API_KEY.',
            ], 503);
        }

        if ($this->todaysMessageCount($user->id) >= self::DAILY_MESSAGE_CAP) {
            return response()->json([
                'message' => "You've reached today's question limit for the doubt-solving assistant. Please try again tomorrow.",
            ], 429);
        }

        $thread = DoubtThread::firstOrCreate(['user_id' => $user->id, 'lesson_id' => $lesson->id]);

        $history = $thread->messages->map(fn ($m) => ['role' => $m->role, 'content' => $m->content])->all();

        $userMessage = $thread->messages()->create([
            'role'    => 'user',
            'content' => $data['question'],
        ]);

        try {
            $result = $assistant->ask($lesson, $history, $data['question']);
        } catch (\RuntimeException $e) {
            // Keep the student's question in the thread (they can see it was
            // asked) but don't leave a fake assistant turn behind for it.
            return response()->json(['message' => $e->getMessage()], 502);
        }

        $assistantMessage = $thread->messages()->create([
            'role'                   => 'assistant',
            'content'                => $result['answer'],
            'grounded_in_transcript' => $result['grounded_in_transcript'],
        ]);

        $thread->touch();

        return response()->json([
            'question'         => $this->formatMessage($userMessage),
            'answer'           => $this->formatMessage($assistantMessage),
            'remaining_today'  => max(0, self::DAILY_MESSAGE_CAP - $this->todaysMessageCount($user->id)),
        ], 201);
    }

    private function canAsk(Lesson $lesson, $user): bool
    {
        if (!$user) return false;
        if ($user->isAdmin() || $lesson->course->instructor_id === $user->id) return true;

        return Enrollment::where('user_id', $user->id)->where('course_id', $lesson->course_id)->exists();
    }

    private function todaysMessageCount(int $userId): int
    {
        return DoubtMessage::where('role', 'user')
            ->whereDate('created_at', now()->toDateString())
            ->whereHas('thread', fn ($q) => $q->where('user_id', $userId))
            ->count();
    }

    private function formatMessage(DoubtMessage $m): array
    {
        return [
            'id'                      => $m->id,
            'role'                    => $m->role,
            'content'                 => $m->content,
            'grounded_in_transcript'  => (bool) $m->grounded_in_transcript,
            'created_at'              => $m->created_at?->toISOString(),
        ];
    }
}
