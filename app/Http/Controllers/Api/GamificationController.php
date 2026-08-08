<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Badge;
use App\Models\UserBadge;
use App\Models\UserStreak;
use Illuminate\Http\Request;

class GamificationController extends Controller
{
    /** GET /api/v1/gamification/me */
    public function me(Request $request)
    {
        $user = $request->user();
        $streak = UserStreak::find($user->id);
        $earned = UserBadge::where('user_id', $user->id)->pluck('earned_at', 'badge_id');

        $badges = Badge::orderBy('sort_order')->get()->map(fn ($b) => [
            'key'         => $b->key,
            'name'        => $b->name,
            'description' => $b->description,
            'icon'        => $b->icon,
            'earned'      => $earned->has($b->id),
            'earned_at'   => $earned->get($b->id)?->toIso8601String(),
        ]);

        return response()->json([
            'current_streak' => $streak?->current_streak ?? 0,
            'longest_streak' => $streak?->longest_streak ?? 0,
            'badges'         => $badges,
            'badges_earned'  => $badges->where('earned', true)->count(),
            'badges_total'   => $badges->count(),
        ]);
    }
}
