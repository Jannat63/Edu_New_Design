<?php

namespace App\Services;

use App\Models\Badge;
use App\Models\Enrollment;
use App\Models\LessonProgress;
use App\Models\User;
use App\Models\UserBadge;
use App\Models\UserStreak;

/**
 * Streaks + badges (Phase 2 item 5). recordActivity() is the single entry
 * point — called once per genuinely-new completion from
 * LessonController::completeLesson(), inside its existing
 * `if (!$progress->is_completed)` guard, so re-clicking "mark complete" on
 * an already-done lesson can't inflate a streak or re-trigger badge checks.
 */
class GamificationService
{
    public function recordActivity(User $user): void
    {
        $today = now()->toDateString();
        $streak = UserStreak::firstOrCreate(['user_id' => $user->id]);

        if ($streak->last_activity_date?->toDateString() === $today) {
            $this->checkBadges($user); // still worth checking — a badge could've just been earned this call
            return;
        }

        $yesterday = now()->subDay()->toDateString();
        $current = $streak->last_activity_date?->toDateString() === $yesterday
            ? $streak->current_streak + 1
            : 1; // streak broken, or this user's first-ever recorded activity

        $streak->update([
            'current_streak'     => $current,
            'longest_streak'     => max($current, $streak->longest_streak),
            'last_activity_date' => $today,
        ]);

        $this->checkBadges($user);
    }

    /** @return \Illuminate\Support\Collection<int, Badge> newly-earned badges, for surfacing a "you earned X!" toast */
    public function checkBadges(User $user): \Illuminate\Support\Collection
    {
        $stats = [
            'lessons_completed' => LessonProgress::where('user_id', $user->id)->where('is_completed', true)->count(),
            'courses_completed' => Enrollment::where('user_id', $user->id)->where('progress_pct', '>=', 100)->count(),
            'streak_days'       => UserStreak::find($user->id)?->current_streak ?? 0,
        ];

        $alreadyEarned = UserBadge::where('user_id', $user->id)->pluck('badge_id');
        $newlyEarned = collect();

        foreach (Badge::whereNotIn('id', $alreadyEarned)->get() as $badge) {
            if (($stats[$badge->criteria_type] ?? 0) >= $badge->criteria_value) {
                UserBadge::firstOrCreate(['user_id' => $user->id, 'badge_id' => $badge->id]);
                $newlyEarned->push($badge);
            }
        }

        return $newlyEarned;
    }
}
