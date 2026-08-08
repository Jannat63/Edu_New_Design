<?php

namespace Database\Seeders;

use App\Models\Badge;
use Illuminate\Database\Seeder;

class BadgeSeeder extends Seeder
{
    public function run(): void
    {
        $badges = [
            ['key' => 'first-lesson',    'name' => 'First Step',       'description' => 'Complete your first lesson',        'icon' => 'Footprints', 'criteria_type' => 'lessons_completed', 'criteria_value' => 1,  'sort_order' => 1],
            ['key' => 'lessons-10',      'name' => 'Getting Going',    'description' => 'Complete 10 lessons',                'icon' => 'BookOpen',   'criteria_type' => 'lessons_completed', 'criteria_value' => 10, 'sort_order' => 2],
            ['key' => 'lessons-50',      'name' => 'Dedicated Learner','description' => 'Complete 50 lessons',                'icon' => 'BookMarked', 'criteria_type' => 'lessons_completed', 'criteria_value' => 50, 'sort_order' => 3],
            ['key' => 'streak-3',        'name' => 'Warming Up',       'description' => 'Learn 3 days in a row',              'icon' => 'Flame',      'criteria_type' => 'streak_days',       'criteria_value' => 3,  'sort_order' => 4],
            ['key' => 'streak-7',        'name' => 'On a Roll',        'description' => 'Learn 7 days in a row',              'icon' => 'Flame',      'criteria_type' => 'streak_days',       'criteria_value' => 7,  'sort_order' => 5],
            ['key' => 'streak-30',       'name' => 'Unstoppable',      'description' => 'Learn 30 days in a row',             'icon' => 'Flame',      'criteria_type' => 'streak_days',       'criteria_value' => 30, 'sort_order' => 6],
            ['key' => 'course-1',        'name' => 'Course Complete',  'description' => 'Finish your first course',           'icon' => 'Trophy',     'criteria_type' => 'courses_completed', 'criteria_value' => 1,  'sort_order' => 7],
            ['key' => 'course-3',        'name' => 'Triple Threat',    'description' => 'Finish 3 courses',                   'icon' => 'Award',      'criteria_type' => 'courses_completed', 'criteria_value' => 3,  'sort_order' => 8],
        ];

        foreach ($badges as $badge) {
            Badge::updateOrCreate(['key' => $badge['key']], $badge);
        }
    }
}
