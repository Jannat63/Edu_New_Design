<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Quiz;
use App\Models\QuizResult;
use App\Models\Enrollment;
use App\Models\Certificate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QuizController extends Controller
{
    /** GET /api/v1/quizzes/{id} — quiz data (questions WITHOUT correct answers revealed) */
    public function show(int $id, Request $request)
    {
        $quiz = Quiz::with(['questions.options'])->findOrFail($id);
        $user = $request->user();

        $this->assertEnrolled($user->id, $quiz->course_id);

        $attempts = $quiz->userAttemptsCount($user->id);
        $canAttempt = $quiz->attempts_allowed === 0 || $attempts < $quiz->attempts_allowed;

        return response()->json([
            'id'                => $quiz->id,
            'title'             => $quiz->title,
            'description'       => $quiz->description,
            'pass_percentage'   => $quiz->pass_percentage,
            'attempts_allowed'  => $quiz->attempts_allowed,
            'attempts_used'     => $attempts,
            'can_attempt'       => $canAttempt,
            'time_limit_minutes'=> $quiz->time_limit_minutes,
            'total_points'      => $quiz->total_points,
            'already_passed'    => $quiz->userPassedQuiz($user->id),
            'questions'         => $quiz->questions->map(fn($q) => [
                'id'     => $q->id,
                'text'   => $q->question_text,
                'type'   => $q->type,
                'points' => $q->points,
                'options'=> $q->options->map(fn($o) => [
                    'id'   => $o->id,
                    'text' => $o->option_text,
                    // is_correct intentionally hidden
                ]),
            ]),
        ]);
    }

    /** POST /api/v1/quizzes/{id}/start — record attempt start (returns attempt number) */
    public function start(int $id, Request $request)
    {
        $quiz = Quiz::findOrFail($id);
        $user = $request->user();

        $this->assertEnrolled($user->id, $quiz->course_id);

        $attempts = $quiz->userAttemptsCount($user->id);

        if ($quiz->attempts_allowed > 0 && $attempts >= $quiz->attempts_allowed) {
            return response()->json([
                'message' => "You have used all {$quiz->attempts_allowed} attempts for this quiz.",
            ], 403);
        }

        return response()->json([
            'message'        => 'Quiz started.',
            'attempt_number' => $attempts + 1,
            'started_at'     => now()->toIso8601String(),
        ]);
    }

    /**
     * POST /api/v1/quizzes/{id}/submit
     * Body: { answers: { [question_id]: option_id }, time_taken_seconds: int }
     */
    public function submit(int $id, Request $request)
    {
        $data = $request->validate([
            'answers'            => 'required|array',
            'answers.*'          => 'required|integer',
            'time_taken_seconds' => 'nullable|integer|min:0',
        ]);

        $quiz = Quiz::with('questions.options')->findOrFail($id);
        $user = $request->user();

        $this->assertEnrolled($user->id, $quiz->course_id);

        $attempts = $quiz->userAttemptsCount($user->id);
        if ($quiz->attempts_allowed > 0 && $attempts >= $quiz->attempts_allowed) {
            return response()->json(['message' => 'No attempts remaining.'], 403);
        }

        // ── Auto-grade ──────────────────────────────────────────────────────
        $totalPoints = 0;
        $scorePoints = 0;
        $breakdown   = [];

        foreach ($quiz->questions as $question) {
            $totalPoints += $question->points;
            $correctOption = $question->options->firstWhere('is_correct', true);
            $selectedId    = $data['answers'][$question->id] ?? null;
            $isCorrect     = $correctOption && $selectedId == $correctOption->id;

            if ($isCorrect) $scorePoints += $question->points;

            $breakdown[] = [
                'question_id'      => $question->id,
                'question'         => $question->question_text,
                'selected_option'  => $selectedId,
                'correct_option'   => $quiz->show_answers ? $correctOption?->id : null,
                'is_correct'       => $isCorrect,
                'explanation'      => $quiz->show_answers ? $question->explanation : null,
            ];
        }

        $scorePct = $totalPoints > 0 ? (int) round(($scorePoints / $totalPoints) * 100) : 0;
        $passed   = $scorePct >= $quiz->pass_percentage;

        $result = QuizResult::create([
            'user_id'            => $user->id,
            'quiz_id'            => $quiz->id,
            'course_id'          => $quiz->course_id,
            'score_percentage'   => $scorePct,
            'score_points'       => $scorePoints,
            'total_points'       => $totalPoints,
            'passed'             => $passed,
            'attempt_number'     => $attempts + 1,
            'answers'            => $data['answers'],
            'time_taken_seconds' => $data['time_taken_seconds'] ?? 0,
            'attempted_at'       => now(),
        ]);

        // If this was the certification quiz and user just passed, generate certificate
        $certificateIssued = false;
        if ($passed) {
            $enrollment = Enrollment::where('user_id', $user->id)->where('course_id', $quiz->course_id)->first();
            if ($enrollment && $enrollment->progress_pct >= 100) {
                $certificateIssued = $this->issueCertificateIfMissing($user->id, $quiz->course_id);
            }
        }

        return response()->json([
            'message'            => $passed ? 'Congratulations! You passed.' : 'You did not pass this time.',
            'score_percentage'   => $scorePct,
            'score_points'       => $scorePoints,
            'total_points'       => $totalPoints,
            'passed'             => $passed,
            'pass_percentage'    => $quiz->pass_percentage,
            'attempt_number'     => $result->attempt_number,
            'attempts_remaining' => $quiz->attempts_allowed > 0 ? max(0, $quiz->attempts_allowed - $result->attempt_number) : null,
            'breakdown'          => $quiz->show_answers ? $breakdown : null,
            'certificate_issued' => $certificateIssued,
        ]);
    }

    /** GET /api/v1/quizzes/{id}/result — latest result */
    public function result(int $id, Request $request)
    {
        $result = QuizResult::where('quiz_id', $id)
            ->where('user_id', $request->user()->id)
            ->orderByDesc('attempt_number')
            ->first();

        if (!$result) {
            return response()->json(['message' => 'No attempts yet.'], 404);
        }

        return response()->json($result);
    }

    /** GET /api/v1/quizzes/{id}/results — all attempts history */
    public function allResults(int $id, Request $request)
    {
        $results = QuizResult::where('quiz_id', $id)
            ->where('user_id', $request->user()->id)
            ->orderBy('attempt_number')
            ->get(['id','attempt_number','score_percentage','passed','time_taken_seconds','attempted_at']);

        return response()->json(['attempts' => $results]);
    }

    // ── HELPERS ───────────────────────────────────────────────────────────────
    private function assertEnrolled(int $userId, int $courseId): void
    {
        $enrolled = Enrollment::where('user_id', $userId)->where('course_id', $courseId)->exists();
        abort_unless($enrolled, 403, 'You must enroll in this course to take its quizzes.');
    }

    private function issueCertificateIfMissing(int $userId, int $courseId): bool
    {
        $exists = Certificate::where('user_id', $userId)->where('course_id', $courseId)->exists();
        if ($exists) return false;

        Certificate::create([
            'user_id'   => $userId,
            'course_id' => $courseId,
            'cert_code' => Certificate::generateCode(),
            'issued_at' => now(),
        ]);

        return true;
    }
}
