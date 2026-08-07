<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Course;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $cats = [
            ['name' => 'Web Development',   'slug' => 'web-development',   'icon' => 'Code',       'color' => '#4F46E5', 'sort_order' => 1],
            ['name' => 'Data Science',       'slug' => 'data-science',       'icon' => 'BarChart2',  'color' => '#10B981', 'sort_order' => 2],
            ['name' => 'Graphic Design',     'slug' => 'graphic-design',     'icon' => 'PenTool',    'color' => '#F97316', 'sort_order' => 3],
            ['name' => 'Digital Marketing',  'slug' => 'digital-marketing',  'icon' => 'TrendingUp', 'color' => '#A855F7', 'sort_order' => 4],
            ['name' => 'English & IELTS',    'slug' => 'english-ielts',      'icon' => 'Globe',      'color' => '#F43F5E', 'sort_order' => 5],
            ['name' => 'Finance',            'slug' => 'finance',            'icon' => 'Lightbulb',  'color' => '#F59E0B', 'sort_order' => 6],
            ['name' => 'Job Prep / BCS & Bank Jobs', 'slug' => 'job-prep-bcs-bank', 'icon' => 'Landmark', 'color' => '#6B2C39', 'sort_order' => 7],
        ];

        foreach ($cats as $cat) {
            Category::updateOrCreate(['slug' => $cat['slug']], $cat);
        }

        $this->command->info('Categories seeded.');
    }
}

class CourseSeeder extends Seeder
{
    public function run(): void
    {
        $courses = [
            [
                'instructor_email' => 'tanvir@edubd.com',
                'category_slug'    => 'web-development',
                'title'            => 'Complete React & Next.js Developer Bootcamp',
                'subtitle'         => 'Master React 18, Next.js 14, TypeScript and Tailwind CSS. Build 5 real-world projects.',
                'language'         => 'Bengali & English',
                'level'            => 'Intermediate',
                'price'            => 2400.00,
                'discount_price'   => 1200.00,
                'status'           => 'published',
                'requirements'     => ['Basic JavaScript knowledge', 'HTML & CSS fundamentals', 'Node.js 18+ installed'],
                'what_you_learn'   => ['Build full-stack apps with React 18 & Next.js 14', 'Master hooks, SSR, SSG, ISR', 'TypeScript for React', 'Tailwind CSS', 'Deploy to Vercel'],
            ],
            [
                'instructor_email' => 'nasrin@edubd.com',
                'category_slug'    => 'data-science',
                'title'            => 'Python for Data Science & Machine Learning',
                'subtitle'         => 'Learn Python, Pandas, NumPy, Scikit-Learn, TensorFlow and build real ML models.',
                'language'         => 'Bengali & English',
                'level'            => 'Beginner',
                'price'            => 3000.00,
                'discount_price'   => 1500.00,
                'status'           => 'published',
                'requirements'     => ['No programming experience needed', 'A computer with internet'],
                'what_you_learn'   => ['Python fundamentals', 'Pandas & NumPy', 'Data visualization', 'Machine learning algorithms', 'Deploy ML models'],
            ],
            [
                'instructor_email' => 'kabir@edubd.com',
                'category_slug'    => 'english-ielts',
                'title'            => 'IELTS Complete Preparation Course 2025',
                'subtitle'         => 'Score 7.0+ in IELTS with our proven step-by-step preparation system.',
                'language'         => 'Bengali & English',
                'level'            => 'All Levels',
                'price'            => 2200.00,
                'discount_price'   => 1100.00,
                'status'           => 'published',
                'requirements'     => ['Basic English reading ability', 'Notepad and pen for practice'],
                'what_you_learn'   => ['All 4 IELTS modules: Listening, Reading, Writing, Speaking', 'Band 7.0+ writing techniques', 'Academic vocabulary', '15 full mock tests'],
            ],
            [
                'instructor_email' => 'fatema@edubd.com',
                'category_slug'    => 'graphic-design',
                'title'            => 'UI/UX Design Masterclass — Figma to Prototype',
                'subtitle'         => 'Learn professional UI/UX design from scratch using Figma and industry best practices.',
                'language'         => 'Bengali & English',
                'level'            => 'Beginner',
                'price'            => 1800.00,
                'discount_price'   => 900.00,
                'status'           => 'published',
                'requirements'     => ['No design experience required', 'Free Figma account'],
                'what_you_learn'   => ['Design thinking process', 'Figma fundamentals to advanced', 'Wireframing & prototyping', 'User research', 'Design systems & components'],
            ],
            [
                'instructor_email' => 'sabbir@edubd.com',
                'category_slug'    => 'digital-marketing',
                'title'            => 'Digital Marketing Complete Bootcamp 2025',
                'subtitle'         => 'Master SEO, Facebook Ads, Google Ads, email marketing and grow any business online.',
                'language'         => 'Bengali',
                'level'            => 'Beginner',
                'price'            => 1600.00,
                'discount_price'   => 800.00,
                'status'           => 'published',
                'requirements'     => ['Basic smartphone or computer use', 'Facebook account'],
                'what_you_learn'   => ['SEO & content marketing', 'Facebook & Instagram Ads', 'Google Ads', 'Email marketing', 'Freelancing on Fiverr'],
            ],
            [
                'instructor_email' => 'mali@edubd.com',
                'category_slug'    => 'finance',
                'title'            => 'Financial Accounting & Tally ERP Complete',
                'subtitle'         => 'Learn bookkeeping, financial statements, and Tally ERP 9 from scratch.',
                'language'         => 'Bengali',
                'level'            => 'Beginner',
                'price'            => 1400.00,
                'discount_price'   => 700.00,
                'status'           => 'published',
                'requirements'     => ['Basic maths (addition, subtraction)', 'No accounting background needed'],
                'what_you_learn'   => ['Double entry bookkeeping', 'Financial statements', 'Tally ERP 9 from scratch', 'GST/VAT accounting', 'Payroll management'],
            ],
        ];

        foreach ($courses as $data) {
            $instructor = User::where('email', $data['instructor_email'])->first();
            $category   = Category::where('slug', $data['category_slug'])->first();

            if (!$instructor || !$category) continue;

            $slug = Str::slug($data['title']);

            Course::updateOrCreate(['slug' => $slug], [
                'instructor_id'  => $instructor->id,
                'category_id'    => $category->id,
                'title'          => $data['title'],
                'slug'           => $slug,
                'subtitle'       => $data['subtitle'],
                'language'       => $data['language'],
                'level'          => $data['level'],
                'price'          => $data['price'],
                'discount_price' => $data['discount_price'],
                'status'         => $data['status'],
                'requirements'   => $data['requirements'],
                'what_you_learn' => $data['what_you_learn'],
                'meta_title'     => $data['title'] . ' | EduBD',
                'meta_description' => $data['subtitle'],
            ]);
        }

        $this->command->info('Courses seeded: ' . count($courses) . ' courses.');
    }
}
