<?php

namespace Database\Seeders;

use App\Models\MenuItem;
use Illuminate\Database\Seeder;

/**
 * Mirrors the menu_items block in database/edubd_seed_data.sql exactly —
 * keep both in sync if either changes (see that file's comment, and
 * UPGRADE_PLAN.md's "known environment limitation" section, for why this
 * project has two parallel seed paths and neither is auto-derived from the
 * other).
 */
class MenuItemSeeder extends Seeder
{
    public function run(): void
    {
        $topLevel = [
            1 => ['title' => 'Home',         'url' => '/',             'sort_order' => 1],
            2 => ['title' => 'Courses',      'url' => '/courses',      'sort_order' => 2],
            3 => ['title' => 'Instructors',  'url' => '/instructors',  'sort_order' => 3],
            4 => ['title' => 'Bundles',      'url' => '/bundles',      'sort_order' => 4],
            5 => ['title' => 'Live Classes', 'url' => '/live-classes', 'sort_order' => 5],
            6 => ['title' => 'Blog',         'url' => '/blog',         'sort_order' => 6],
            7 => ['title' => 'About',        'url' => '/about',       'sort_order' => 7],
        ];

        foreach ($topLevel as $id => $item) {
            MenuItem::updateOrCreate(['id' => $id], $item + ['is_active' => true]);
        }

        $categoryChildren = [
            8  => ['title' => 'Web Development',            'slug' => 'web-development'],
            9  => ['title' => 'Data Science',                'slug' => 'data-science'],
            10 => ['title' => 'Graphic Design',               'slug' => 'graphic-design'],
            11 => ['title' => 'Digital Marketing',            'slug' => 'digital-marketing'],
            12 => ['title' => 'English & IELTS',              'slug' => 'english-ielts'],
            13 => ['title' => 'Finance',                       'slug' => 'finance'],
            14 => ['title' => 'Job Prep / BCS & Bank Jobs',    'slug' => 'job-prep-bcs-bank'],
        ];

        $i = 0;
        foreach ($categoryChildren as $id => $c) {
            $i++;
            MenuItem::updateOrCreate(['id' => $id], [
                'parent_id'      => 2,
                'title'          => $c['title'],
                'url'            => '/courses?category=' . $c['slug'],
                'category_group' => 'Browse by category',
                'is_featured'    => $c['slug'] === 'job-prep-bcs-bank',
                'is_active'      => true,
                'sort_order'     => $i,
            ]);
        }

        MenuItem::updateOrCreate(['id' => 15], [
            'parent_id'      => 2,
            'title'          => 'Browse All Courses',
            'url'            => '/courses',
            'category_group' => 'Browse by category',
            'is_active'      => true,
            'sort_order'     => 8,
        ]);

        $aboutChildren = [
            16 => ['title' => 'About EduBD',          'url' => '/about'],
            17 => ['title' => 'Our Mission',          'url' => '/mission'],
            18 => ['title' => 'Become an Instructor', 'url' => '/become-instructor'],
            19 => ['title' => 'Press & Media',        'url' => '/press'],
            20 => ['title' => 'Contact Us',           'url' => '/contact'],
        ];

        $i = 0;
        foreach ($aboutChildren as $id => $c) {
            $i++;
            MenuItem::updateOrCreate(['id' => $id], [
                'parent_id'  => 7,
                'title'      => $c['title'],
                'url'        => $c['url'],
                'is_active'  => true,
                'sort_order' => $i,
            ]);
        }
    }
}
