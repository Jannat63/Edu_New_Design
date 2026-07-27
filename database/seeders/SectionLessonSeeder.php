<?php

namespace Database\Seeders;

use App\Models\{Course, Section, Lesson, Enrollment, Payment, Review,
                Certificate, Quiz, Question, QuestionOption,
                BlogCategory, BlogPost, SiteSetting, User};
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

// ─────────────────────────────────────────────────────────────────────────────
class SectionLessonSeeder extends Seeder
{
    public function run(): void
    {
        $course = Course::where('slug', 'complete-react-nextjs-developer-bootcamp')->first();
        if (!$course) return;

        $sections = [
            ['title' => 'Getting Started',           'lessons' => [
                ['title' => 'Welcome & course overview',          'type' => 'video',    'duration_seconds' => 320,  'is_preview' => true],
                ['title' => 'Setting up Node.js & VS Code',       'type' => 'video',    'duration_seconds' => 940,  'is_preview' => true],
                ['title' => 'Course resources & GitHub repo',     'type' => 'resource', 'duration_seconds' => 0,    'is_preview' => false],
            ]],
            ['title' => 'React 18 Fundamentals',     'lessons' => [
                ['title' => 'What is React & the virtual DOM?',   'type' => 'video',    'duration_seconds' => 720,  'is_preview' => false],
                ['title' => 'JSX & functional components',         'type' => 'video',    'duration_seconds' => 1215, 'is_preview' => false],
                ['title' => 'Props & component composition',       'type' => 'video',    'duration_seconds' => 1110, 'is_preview' => false],
                ['title' => 'useState & controlled inputs',        'type' => 'video',    'duration_seconds' => 1530, 'is_preview' => false],
                ['title' => 'useEffect & side effects',            'type' => 'video',    'duration_seconds' => 1800, 'is_preview' => false],
                ['title' => 'Quiz: React basics',                  'type' => 'quiz',     'duration_seconds' => 0,    'is_preview' => false],
            ]],
            ['title' => 'Next.js 14 — App Router',   'lessons' => [
                ['title' => 'Next.js vs React',                    'type' => 'video',    'duration_seconds' => 720,  'is_preview' => false],
                ['title' => 'App Router — pages, layouts',         'type' => 'video',    'duration_seconds' => 1515, 'is_preview' => false],
                ['title' => 'Server vs client components',         'type' => 'video',    'duration_seconds' => 1800, 'is_preview' => false],
                ['title' => 'Data fetching strategies',            'type' => 'video',    'duration_seconds' => 2120, 'is_preview' => false],
            ]],
            ['title' => 'Deployment & Certification','lessons' => [
                ['title' => 'Deploying to Vercel step by step',   'type' => 'video',    'duration_seconds' => 900,  'is_preview' => false],
                ['title' => 'Final certification exam',            'type' => 'quiz',     'duration_seconds' => 0,    'is_preview' => false],
            ]],
        ];

        $totalLessons  = 0;
        $totalDuration = 0;

        foreach ($sections as $si => $secData) {
            $section = Section::updateOrCreate(
                ['course_id' => $course->id, 'title' => $secData['title']],
                ['sort_order' => $si + 1]
            );

            foreach ($secData['lessons'] as $li => $lesData) {
                Lesson::updateOrCreate(
                    ['section_id' => $section->id, 'title' => $lesData['title']],
                    [
                        'course_id'        => $course->id,
                        'type'             => $lesData['type'],
                        'duration_seconds' => $lesData['duration_seconds'],
                        'is_preview'       => $lesData['is_preview'],
                        'sort_order'       => $li + 1,
                    ]
                );
                $totalLessons++;
                $totalDuration += $lesData['duration_seconds'];
            }
        }

        $course->update([
            'total_lessons'          => $totalLessons,
            'total_duration_minutes' => (int) round($totalDuration / 60),
        ]);

        $this->command->info("Sections & lessons seeded for: {$course->title}");
    }
}

// ─────────────────────────────────────────────────────────────────────────────
class QuizSeeder extends Seeder
{
    public function run(): void
    {
        $course = Course::where('slug', 'complete-react-nextjs-developer-bootcamp')->first();
        if (!$course) return;

        $quiz = Quiz::updateOrCreate(
            ['course_id' => $course->id, 'title' => 'React Fundamentals Quiz'],
            ['pass_percentage' => 70, 'attempts_allowed' => 3, 'show_answers' => true]
        );

        $questions = [
            [
                'text'    => 'What is the virtual DOM in React?',
                'type'    => 'mcq',
                'options' => [
                    ['text' => 'A copy of the real DOM kept in memory',       'correct' => true],
                    ['text' => 'A browser API for faster rendering',           'correct' => false],
                    ['text' => 'A special HTML element for React',             'correct' => false],
                    ['text' => 'None of the above',                            'correct' => false],
                ],
            ],
            [
                'text'    => 'useState is a React Hook.',
                'type'    => 'true_false',
                'options' => [
                    ['text' => 'True',  'correct' => true],
                    ['text' => 'False', 'correct' => false],
                ],
            ],
            [
                'text'    => 'Which hook is used for side effects in React?',
                'type'    => 'mcq',
                'options' => [
                    ['text' => 'useState',    'correct' => false],
                    ['text' => 'useEffect',   'correct' => true],
                    ['text' => 'useContext',  'correct' => false],
                    ['text' => 'useReducer',  'correct' => false],
                ],
            ],
        ];

        foreach ($questions as $qi => $qData) {
            $question = Question::updateOrCreate(
                ['quiz_id' => $quiz->id, 'question_text' => $qData['text']],
                ['type' => $qData['type'], 'points' => 1, 'sort_order' => $qi + 1]
            );

            foreach ($qData['options'] as $oi => $opt) {
                QuestionOption::updateOrCreate(
                    ['question_id' => $question->id, 'option_text' => $opt['text']],
                    ['is_correct' => $opt['correct'], 'sort_order' => $oi + 1]
                );
            }
        }

        $this->command->info('Quiz seeded.');
    }
}

// ─────────────────────────────────────────────────────────────────────────────
class EnrollmentSeeder extends Seeder
{
    public function run(): void
    {
        $students = User::whereHas('role', fn($q) => $q->where('slug', 'student'))->get();
        $courses  = Course::where('status', 'published')->get();

        foreach ($students as $student) {
            // Each student enrolls in 2–4 random courses
            $enrolled = $courses->random(min(rand(2, 4), $courses->count()));

            foreach ($enrolled as $course) {
                $progress = rand(0, 100);
                Enrollment::updateOrCreate(
                    ['user_id' => $student->id, 'course_id' => $course->id],
                    [
                        'amount_paid'       => $course->discount_price ?? $course->price,
                        'progress_pct'      => $progress,
                        'completed_lessons' => (int) round(($progress / 100) * ($course->total_lessons ?: 10)),
                        'enrolled_at'       => now()->subDays(rand(10, 180)),
                        'completed_at'      => $progress >= 100 ? now()->subDays(rand(1, 30)) : null,
                    ]
                );
            }
        }

        $this->command->info('Enrollments seeded.');
    }
}

// ─────────────────────────────────────────────────────────────────────────────
class PaymentSeeder extends Seeder
{
    public function run(): void
    {
        $gateways = ['bkash', 'nagad', 'sslcommerz'];

        Enrollment::with(['user', 'course'])->get()->each(function ($enrollment) use ($gateways) {
            Payment::updateOrCreate(
                ['user_id' => $enrollment->user_id, 'course_id' => $enrollment->course_id],
                [
                    'amount'         => $enrollment->amount_paid,
                    'currency'       => 'BDT',
                    'gateway'        => $gateways[array_rand($gateways)],
                    'transaction_id' => strtoupper(Str::random(12)),
                    'status'         => 'paid',
                    'paid_at'        => $enrollment->enrolled_at,
                ]
            );
        });

        $this->command->info('Payments seeded.');
    }
}

// ─────────────────────────────────────────────────────────────────────────────
class ReviewSeeder extends Seeder
{
    public function run(): void
    {
        $reviews = [
            ['rating' => 5, 'body' => 'Best React course I have ever taken! The projects are incredibly practical.'],
            ['rating' => 5, 'body' => 'Tanvir explains everything so clearly in Bengali. Got my first dev job!'],
            ['rating' => 4, 'body' => 'Very detailed content. Would love more advanced topics in future.'],
            ['rating' => 5, 'body' => 'The Next.js section is gold. Building real apps made everything click.'],
            ['rating' => 5, 'body' => 'Worth every taka. Already earning freelance income after this course.'],
        ];

        $completedEnrollments = Enrollment::where('progress_pct', '>=', 50)->take(5)->get();

        foreach ($completedEnrollments as $i => $enrollment) {
            $reviewData = $reviews[$i % count($reviews)];
            Review::updateOrCreate(
                ['user_id' => $enrollment->user_id, 'course_id' => $enrollment->course_id],
                array_merge($reviewData, ['is_visible' => true])
            );
        }

        $this->command->info('Reviews seeded.');
    }
}

// ─────────────────────────────────────────────────────────────────────────────
class CertificateSeeder extends Seeder
{
    public function run(): void
    {
        Enrollment::where('progress_pct', 100)->each(function ($e) {
            Certificate::updateOrCreate(
                ['user_id' => $e->user_id, 'course_id' => $e->course_id],
                [
                    'cert_code' => 'EDU-' . date('Y') . '-' . strtoupper(Str::random(6)),
                    'issued_at' => $e->completed_at ?? now(),
                ]
            );
        });

        $this->command->info('Certificates seeded.');
    }
}

// ─────────────────────────────────────────────────────────────────────────────
class BlogSeeder extends Seeder
{
    public function run(): void
    {
        $cats = [
            ['name' => 'Career Tips',      'slug' => 'career-tips'],
            ['name' => 'Technology',        'slug' => 'technology'],
            ['name' => 'Learning Tips',     'slug' => 'learning-tips'],
            ['name' => 'Success Stories',   'slug' => 'success-stories'],
        ];
        foreach ($cats as $c) BlogCategory::updateOrCreate(['slug' => $c['slug']], $c);

        $admin = User::whereHas('role', fn($q) => $q->where('slug', 'admin'))->first();
        $cat   = BlogCategory::where('slug', 'career-tips')->first();

        $posts = [
            ['title' => 'Top 10 Programming Skills to Learn in Bangladesh 2025',   'status' => 'published'],
            ['title' => 'How to Prepare for IELTS from Bangladesh: Complete Guide', 'status' => 'published'],
            ['title' => 'Complete Guide to Freelancing from Bangladesh on Fiverr',  'status' => 'published'],
            ['title' => 'bKash vs Nagad: Which is Better for Online Payments?',    'status' => 'draft'],
        ];

        foreach ($posts as $p) {
            BlogPost::updateOrCreate(['slug' => Str::slug($p['title'])], [
                'author_id'       => $admin->id,
                'blog_category_id'=> $cat->id,
                'title'           => $p['title'],
                'slug'            => Str::slug($p['title']),
                'excerpt'         => 'Learn everything you need to know about ' . strtolower($p['title']) . '.',
                'content'         => '<p>This is the full article content for ' . $p['title'] . '. More content coming soon.</p>',
                'status'          => $p['status'],
                'read_time_minutes' => rand(3, 10),
                'published_at'    => $p['status'] === 'published' ? now()->subDays(rand(1, 60)) : null,
                'meta_title'      => $p['title'] . ' | EduBD Blog',
                'meta_description'=> 'Learn about ' . strtolower($p['title']) . ' on the EduBD blog.',
            ]);
        }

        $this->command->info('Blog seeded.');
    }
}

// ─────────────────────────────────────────────────────────────────────────────
class SiteSettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            // General
            ['key' => 'site_name',           'value' => 'EduBD',                                          'type' => 'string',  'group' => 'general',  'label' => 'Site Name'],
            ['key' => 'site_tagline',        'value' => "Bangladesh's #1 Online Learning Platform",       'type' => 'string',  'group' => 'general',  'label' => 'Tagline'],
            ['key' => 'site_email',          'value' => 'support@edubd.com',                              'type' => 'string',  'group' => 'general',  'label' => 'Support Email'],
            ['key' => 'site_phone',          'value' => '+880 1700-000000',                               'type' => 'string',  'group' => 'general',  'label' => 'Phone'],
            ['key' => 'maintenance_mode',    'value' => '0',                                              'type' => 'boolean', 'group' => 'general',  'label' => 'Maintenance Mode'],
            // Payments
            ['key' => 'bkash_enabled',       'value' => '1',                                              'type' => 'boolean', 'group' => 'payment',  'label' => 'bKash Enabled'],
            ['key' => 'nagad_enabled',        'value' => '1',                                              'type' => 'boolean', 'group' => 'payment',  'label' => 'Nagad Enabled'],
            ['key' => 'sslcommerz_enabled',  'value' => '1',                                              'type' => 'boolean', 'group' => 'payment',  'label' => 'SSLCommerz Enabled'],
            ['key' => 'currency',            'value' => 'BDT',                                            'type' => 'string',  'group' => 'payment',  'label' => 'Currency'],
            // SEO
            ['key' => 'meta_title',          'value' => "EduBD — Bangladesh's #1 Online Learning Platform", 'type' => 'string', 'group' => 'seo',     'label' => 'Default Meta Title'],
            ['key' => 'meta_description',    'value' => 'Learn from Bangladesh\'s top experts. 500+ courses in Bengali & English.', 'type' => 'string', 'group' => 'seo', 'label' => 'Default Meta Description'],
            ['key' => 'google_analytics_id', 'value' => '',                                               'type' => 'string',  'group' => 'seo',      'label' => 'Google Analytics ID'],
            // Email
            ['key' => 'mail_from_name',      'value' => 'EduBD',                                          'type' => 'string',  'group' => 'email',    'label' => 'Mail From Name'],
            ['key' => 'mail_from_address',   'value' => 'noreply@edubd.com',                              'type' => 'string',  'group' => 'email',    'label' => 'Mail From Address'],
        ];

        foreach ($settings as $s) {
            SiteSetting::updateOrCreate(['key' => $s['key']], $s);
        }

        $this->command->info('Site settings seeded.');
    }
}
