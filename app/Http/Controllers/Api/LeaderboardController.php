<?php

namespace App\Http\Controllers\Api;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\LessonProgress;
use App\Models\QuizResult;
use App\Models\UserStreak;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Phase 6 item 18, UPGRADE_PLAN.md. Scoped per-course rather than one global
 * list — a Web Dev learner ranked against an IELTS learner tells nobody
 * anything useful, and this matters most for EduBD's own exam-prep
 * categories (BCS/bank-job prep, IELTS) specifically, where "how do I
 * compare to everyone else cramming for the same exam" is the whole point.
 *
 * There's no stored "points" field anywhere in this schema (checked
 * GamificationService, UserStreak, UserBadge, QuizResult) — the market
 * research note that prompted this assumed one existed and was wrong about
 * that detail. What's real: lessons completed, quiz scores (best attempt
 * per quiz, not summed across retries — see below), and streaks. The score
 * below is a documented composite of those, not a pre-existing metric.
 */
class LeaderboardController extends Controller
{
    /** GET /api/v1/courses/{id}/leaderboard */
    public function course(int $courseId, Request $request)
    {
        $course = Course::findOrFail($courseId);

        // Best score per quiz per student (not every attempt summed — a
        // student who retries a quiz 5 times shouldn't out-rank one who
        // passed it in one try just by attempting more).
        $bestQuizScores = QuizResult::where('course_id', $courseId)
            ->select('user_id', 'quiz_id', DB::raw('MAX(score_points) as best'))
            ->groupBy('user_id', 'quiz_id')
            ->get()
            ->groupBy('user_id')
            ->map(fn($rows) => (int) $rows->sum('best'));

        $lessonCounts = LessonProgress::where('course_id', $courseId)
            ->where('is_completed', true)
            ->select('user_id', DB::raw('count(*) as cnt'))
            ->groupBy('user_id')
            ->pluck('cnt', 'user_id');

        $streaks = UserStreak::whereIn('user_id',
                Enrollment::where('course_id', $courseId)->pluck('user_id')
            )->pluck('current_streak', 'user_id');

        $rows = Enrollment::where('course_id', $courseId)
            ->with('user:id,name,avatar')
            ->get()
            ->map(function ($e) use ($bestQuizScores, $lessonCounts, $streaks) {
                $lessons    = (int) ($lessonCounts[$e->user_id] ?? 0);
                $quizPoints = (int) ($bestQuizScores[$e->user_id] ?? 0);
                $streak     = (int) ($streaks[$e->user_id] ?? 0);

                return [
                    'user_id'           => $e->user_id,
                    'name'              => $e->user?->name,
                    'avatar'            => $e->user?->avatar_url,
                    'lessons_completed' => $lessons,
                    'quiz_points'       => $quizPoints,
                    'current_streak'    => $streak,
                    'progress_pct'      => (int) $e->progress_pct,
                    // Weights are deliberately simple and documented rather
                    // than tuned: a completed lesson is worth 10, each quiz
                    // point earned (best attempt) is worth 1, each day of
                    // current streak is worth 5. Revisit if this rewards the
                    // wrong behavior once there's real usage to look at.
                    'score' => $lessons * 10 + $quizPoints + $streak * 5,
                ];
            })
            ->filter(fn($r) => $r['name'] !== null) // drop rows for deleted users
            ->sortByDesc('score')
            ->values()
            ->take(50)
            ->map(function ($r, $i) {
                $r['rank'] = $i + 1;
                return $r;
            });

        $myRank = $request->user()
            ? $rows->firstWhere('user_id', $request->user()->id)
            : null;

        return response()->json([
            'course_id' => $course->id,
            'course_title' => $course->title,
            'leaderboard' => $rows->values(),
            'my_rank' => $myRank,
        ]);
    }
}
