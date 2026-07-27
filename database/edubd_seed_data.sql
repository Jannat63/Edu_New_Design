-- ============================================================
--  EduBD — Seed / Demo Data (DATA ONLY, no schema)
--  Run AFTER `php artisan migrate` has created the schema.
--  setup.sh does this automatically — you shouldn't need to
--  run this by hand except for a manual/advanced install.
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;
USE edubd;

INSERT INTO roles (id, name, slug, created_at, updated_at) VALUES
(1, 'Admin',      'admin',      NOW(), NOW()),
(2, 'Student',    'student',    NOW(), NOW()),
(3, 'Instructor', 'instructor', NOW(), NOW());

INSERT INTO users (id, role_id, name, email, phone, city, bio, password, is_active, email_verified_at, created_at, updated_at) VALUES
-- Admin  → password: password
(1,  1, 'EduBD Admin',       'admin@edubd.com',    '01700000000', 'Dhaka',      'Platform administrator',                                            '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, NOW(), NOW(), NOW()),
-- Instructors  → password: password
(2,  3, 'Tanvir Ahmed',      'tanvir@edubd.com',   '01711111111', 'Dhaka',      'Senior React & Next.js developer with 10+ years of experience.',    '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, NOW(), NOW(), NOW()),
(3,  3, 'Dr. Nasrin Khatun', 'nasrin@edubd.com',   '01722222222', 'Dhaka',      'PhD in Computer Science, specializing in ML and data science.',      '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, NOW(), NOW(), NOW()),
(4,  3, 'Kabir Hossain',     'kabir@edubd.com',    '01733333333', 'Chittagong', 'IELTS 9.0 scorer, certified British Council trainer.',               '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, NOW(), NOW(), NOW()),
(5,  3, 'Fatema Begum',      'fatema@edubd.com',   '01744444444', 'Dhaka',      'UI/UX designer with 8 years at leading BD tech companies.',          '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, NOW(), NOW(), NOW()),
(6,  3, 'Sabbir Rahman',     'sabbir@edubd.com',   '01755555555', 'Sylhet',     'Digital marketing strategist managing 1cr+ ad budgets.',             '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, NOW(), NOW(), NOW()),
(7,  3, 'Mohammed Ali',      'mali@edubd.com',     '01766666666', 'Rajshahi',   'Chartered Accountant with 15 years in corporate finance.',            '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, NOW(), NOW(), NOW()),
-- Students  → password: password
(8,  2, 'Rafiqul Islam',     'rafiq@gmail.com',    '01811111111', 'Dhaka',      NULL, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, NOW(), NOW(), NOW()),
(9,  2, 'Fatima Akter',      'fatima@gmail.com',   '01822222222', 'Chittagong', NULL, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, NOW(), NOW(), NOW()),
(10, 2, 'Karim Ahmed',       'karim@gmail.com',    '01833333333', 'Sylhet',     NULL, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, NOW(), NOW(), NOW()),
(11, 2, 'Rina Parvin',       'rina@gmail.com',     '01844444444', 'Khulna',     NULL, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, NOW(), NOW(), NOW()),
(12, 2, 'Sumaiya Islam',     'sumaiya@gmail.com',  '01855555555', 'Dhaka',      NULL, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, NOW(), NOW(), NOW()),
(13, 2, 'Rahim Uddin',       'rahim@gmail.com',    '01866666666', 'Rajshahi',   NULL, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, NOW(), NOW(), NOW());

INSERT INTO categories (id, name, slug, icon, color, sort_order, is_active, created_at, updated_at) VALUES
(1, 'Web Development',   'web-development',   'Code',       '#4F46E5', 1, 1, NOW(), NOW()),
(2, 'Data Science',      'data-science',      'BarChart2',  '#10B981', 2, 1, NOW(), NOW()),
(3, 'Graphic Design',    'graphic-design',    'PenTool',    '#F97316', 3, 1, NOW(), NOW()),
(4, 'Digital Marketing', 'digital-marketing', 'TrendingUp', '#A855F7', 4, 1, NOW(), NOW()),
(5, 'English & IELTS',   'english-ielts',     'Globe',      '#F43F5E', 5, 1, NOW(), NOW()),
(6, 'Finance',           'finance',           'Lightbulb',  '#F59E0B', 6, 1, NOW(), NOW());

INSERT INTO courses (id, category_id, instructor_id, title, slug, subtitle, language, level, price, discount_price, status, average_rating, total_reviews, total_students, total_lessons, total_duration_minutes, created_at, updated_at) VALUES
(1, 1, 2, 'Complete React & Next.js Developer Bootcamp',  'complete-react-nextjs-developer-bootcamp',  'Master React 18, Next.js 14, TypeScript, Tailwind CSS. Build 5 real-world projects.',        'Bengali & English', 'Intermediate', 2400.00, 1200.00, 'published', 4.9, 1240, 8500,  185, 2520, NOW(), NOW()),
(2, 2, 3, 'Python for Data Science & Machine Learning',   'python-for-data-science-machine-learning',  'Learn Python, Pandas, NumPy, Scikit-Learn, TensorFlow and build real ML models.',             'Bengali & English', 'Beginner',     3000.00, 1500.00, 'published', 4.8, 980,  6200,  140, 3360, NOW(), NOW()),
(3, 5, 4, 'IELTS Complete Preparation Course 2025',       'ielts-complete-preparation-course-2025',    'Score 7.0+ in IELTS with our proven step-by-step preparation system.',                       'Bengali & English', 'All Levels',   2200.00, 1100.00, 'published', 4.9, 2100, 12000, 96,  2280, NOW(), NOW()),
(4, 3, 5, 'UI/UX Design Masterclass — Figma to Prototype','uiux-design-masterclass-figma-to-prototype','Learn professional UI/UX design from scratch using Figma and industry best practices.',        'Bengali & English', 'Beginner',     1800.00, 900.00,  'published', 4.7, 750,  4100,  88,  1860, NOW(), NOW()),
(5, 4, 6, 'Digital Marketing Complete Bootcamp 2025',     'digital-marketing-complete-bootcamp-2025',  'Master SEO, Facebook Ads, Google Ads, email marketing and grow any business online.',         'Bengali',           'Beginner',     1600.00, 800.00,  'published', 4.8, 890,  5800,  88,  1680, NOW(), NOW()),
(6, 6, 7, 'Financial Accounting & Tally ERP Complete',    'financial-accounting-tally-erp-complete',   'Learn bookkeeping, financial statements, and Tally ERP 9 from scratch.',                     'Bengali',           'Beginner',     1400.00, 700.00,  'published', 4.6, 620,  3400,  72,  1440, NOW(), NOW());

INSERT INTO sections (id, course_id, title, sort_order, created_at, updated_at) VALUES
(1, 1, 'Getting Started',            1, NOW(), NOW()),
(2, 1, 'React 18 Fundamentals',      2, NOW(), NOW()),
(3, 1, 'Next.js 14 App Router',      3, NOW(), NOW()),
(4, 1, 'TypeScript & Tailwind CSS',  4, NOW(), NOW()),
(5, 1, '5 Real-World Projects',      5, NOW(), NOW()),
(6, 1, 'Deployment & Certification', 6, NOW(), NOW());

INSERT INTO lessons (id, section_id, course_id, title, type, duration_seconds, is_preview, sort_order, created_at, updated_at) VALUES
(1,  1, 1, 'Welcome & course overview',           'video',    320,  1, 1, NOW(), NOW()),
(2,  1, 1, 'Setting up Node.js & VS Code',        'video',    940,  1, 2, NOW(), NOW()),
(3,  1, 1, 'Course resources & GitHub repo',      'resource', 0,    0, 3, NOW(), NOW()),
(4,  2, 1, 'What is React & the virtual DOM?',    'video',    720,  0, 1, NOW(), NOW()),
(5,  2, 1, 'JSX & functional components',         'video',    1215, 0, 2, NOW(), NOW()),
(6,  2, 1, 'Props & component composition',       'video',    1110, 0, 3, NOW(), NOW()),
(7,  2, 1, 'useState & controlled inputs',        'video',    1530, 0, 4, NOW(), NOW()),
(8,  2, 1, 'useEffect & side effects',            'video',    1800, 0, 5, NOW(), NOW()),
(9,  2, 1, 'Quiz: React basics',                  'quiz',     0,    0, 6, NOW(), NOW()),
(10, 3, 1, 'Next.js vs React',                    'video',    720,  0, 1, NOW(), NOW()),
(11, 3, 1, 'App Router — pages, layouts',         'video',    1515, 0, 2, NOW(), NOW()),
(12, 3, 1, 'Server vs client components',         'video',    1800, 0, 3, NOW(), NOW()),
(13, 3, 1, 'Data fetching strategies',            'video',    2120, 0, 4, NOW(), NOW()),
(14, 4, 1, 'TypeScript basics for React',         'video',    1320, 0, 1, NOW(), NOW()),
(15, 4, 1, 'Tailwind CSS setup & core concepts',  'video',    1500, 0, 2, NOW(), NOW()),
(16, 5, 1, 'Project 1: Portfolio website',        'video',    4800, 0, 1, NOW(), NOW()),
(17, 5, 1, 'Project 2: Full e-commerce store',    'video',    7800, 0, 2, NOW(), NOW()),
(18, 6, 1, 'Deploying to Vercel',                 'video',    900,  0, 1, NOW(), NOW()),
(19, 6, 1, 'Final certification exam',            'quiz',     0,    0, 2, NOW(), NOW());

INSERT INTO enrollments (id, user_id, course_id, amount_paid, progress_pct, completed_lessons, enrolled_at, completed_at, created_at, updated_at) VALUES
(1,  8,  1, 1200.00, 72,  13, DATE_SUB(NOW(), INTERVAL 90 DAY),  NULL,                          NOW(), NOW()),
(2,  8,  3, 1100.00, 100, 96, DATE_SUB(NOW(), INTERVAL 120 DAY), DATE_SUB(NOW(), INTERVAL 30 DAY), NOW(), NOW()),
(3,  9,  1, 1200.00, 45,  8,  DATE_SUB(NOW(), INTERVAL 60 DAY),  NULL,                          NOW(), NOW()),
(4,  9,  5, 800.00,  80,  70, DATE_SUB(NOW(), INTERVAL 45 DAY),  NULL,                          NOW(), NOW()),
(5,  10, 2, 1500.00, 35,  49, DATE_SUB(NOW(), INTERVAL 30 DAY),  NULL,                          NOW(), NOW()),
(6,  10, 4, 900.00,  60,  53, DATE_SUB(NOW(), INTERVAL 50 DAY),  NULL,                          NOW(), NOW()),
(7,  11, 4, 900.00,  100, 88, DATE_SUB(NOW(), INTERVAL 80 DAY),  DATE_SUB(NOW(), INTERVAL 10 DAY), NOW(), NOW()),
(8,  12, 1, 1200.00, 20,  4,  DATE_SUB(NOW(), INTERVAL 15 DAY),  NULL,                          NOW(), NOW()),
(9,  13, 2, 1500.00, 55,  77, DATE_SUB(NOW(), INTERVAL 40 DAY),  NULL,                          NOW(), NOW());

INSERT INTO payments (id, user_id, course_id, amount, currency, gateway, transaction_id, status, paid_at, created_at, updated_at) VALUES
(1, 8,  1, 1200.00, 'BDT', 'nagad',     'NGD-5512-8834', 'paid', DATE_SUB(NOW(), INTERVAL 90 DAY),  NOW(), NOW()),
(2, 8,  3, 1100.00, 'BDT', 'bkash',     'BKS-8843-2291', 'paid', DATE_SUB(NOW(), INTERVAL 120 DAY), NOW(), NOW()),
(3, 9,  1, 1200.00, 'BDT', 'sslcommerz','SSL-1193-6647', 'paid', DATE_SUB(NOW(), INTERVAL 60 DAY),  NOW(), NOW()),
(4, 9,  5, 800.00,  'BDT', 'bkash',     'BKS-7712-4490', 'paid', DATE_SUB(NOW(), INTERVAL 45 DAY),  NOW(), NOW()),
(5, 10, 2, 1500.00, 'BDT', 'nagad',     'NGD-6621-3312', 'paid', DATE_SUB(NOW(), INTERVAL 30 DAY),  NOW(), NOW()),
(6, 10, 4, 900.00,  'BDT', 'bkash',     'BKS-3310-9981', 'paid', DATE_SUB(NOW(), INTERVAL 50 DAY),  NOW(), NOW()),
(7, 11, 4, 900.00,  'BDT', 'sslcommerz','SSL-4421-7753', 'paid', DATE_SUB(NOW(), INTERVAL 80 DAY),  NOW(), NOW()),
(8, 12, 1, 1200.00, 'BDT', 'bkash',     'BKS-9981-2234', 'paid', DATE_SUB(NOW(), INTERVAL 15 DAY),  NOW(), NOW()),
(9, 13, 2, 1500.00, 'BDT', 'nagad',     'NGD-1144-8890', 'paid', DATE_SUB(NOW(), INTERVAL 40 DAY),  NOW(), NOW());

INSERT INTO reviews (id, user_id, course_id, rating, body, is_visible, created_at, updated_at) VALUES
(1, 8,  1, 5, 'Best React course I have taken! The Next.js projects are incredibly practical. I built 5 real apps.',        1, DATE_SUB(NOW(), INTERVAL 20 DAY), NOW()),
(2, 9,  1, 5, 'Tanvir explains everything so clearly in Bengali. Got my first dev job after this course!',                   1, DATE_SUB(NOW(), INTERVAL 15 DAY), NOW()),
(3, 10, 2, 5, 'Dr. Nasrin explains ML concepts in a way anyone can understand. Best data science course in Bangladesh.',     1, DATE_SUB(NOW(), INTERVAL 10 DAY), NOW()),
(4, 8,  3, 5, 'Scored 7.5 in IELTS after this course. The mock tests were exactly like the real exam.',                     1, DATE_SUB(NOW(), INTERVAL 25 DAY), NOW()),
(5, 11, 4, 4, 'Really solid design course. The Figma sections are excellent. Would love more advanced prototyping content.',  1, DATE_SUB(NOW(), INTERVAL 5 DAY),  NOW());

INSERT INTO certificates (id, user_id, course_id, cert_code, issued_at, created_at, updated_at) VALUES
(1, 8,  3, 'EDU-2024-8A3F2B', DATE_SUB(NOW(), INTERVAL 30 DAY), NOW(), NOW()),
(2, 11, 4, 'EDU-2024-C7D1E9', DATE_SUB(NOW(), INTERVAL 10 DAY), NOW(), NOW());

INSERT INTO blog_categories (id, name, slug, created_at, updated_at) VALUES
(1, 'Career Tips',    'career-tips',    NOW(), NOW()),
(2, 'Technology',     'technology',     NOW(), NOW()),
(3, 'Learning Tips',  'learning-tips',  NOW(), NOW()),
(4, 'Success Stories','success-stories',NOW(), NOW());

INSERT INTO blog_posts (id, author_id, blog_category_id, title, slug, excerpt, content, status, read_time_minutes, view_count, meta_title, meta_description, focus_keyword, seo_score, word_count, published_at, created_at, updated_at) VALUES
(1, 1, 1, 'Top 10 Programming Skills to Learn in Bangladesh in 2025', 'top-10-programming-skills-bangladesh-2025',
 'Discover which programming skills are in highest demand in Bangladesh right now.',
 '<p>Bangladesh tech industry is growing fast. Here are the top skills to learn in 2025...</p>',
 'published', 8, 4260,
 'Top 10 Programming Skills Bangladesh 2025 | EduBD',
 'Discover which programming skills are most in-demand in Bangladesh in 2025.',
 'programming skills Bangladesh 2025', 78, 1600,
 DATE_SUB(NOW(), INTERVAL 10 DAY), NOW(), NOW()),

(2, 1, 1, 'How to Prepare for IELTS from Bangladesh: Complete Guide', 'how-to-prepare-ielts-bangladesh-complete-guide',
 'A complete step-by-step guide to preparing for IELTS from Bangladesh and scoring 7.0+.',
 '<p>IELTS preparation requires a structured approach. Here is how to score 7.0+ from Bangladesh...</p>',
 'published', 6, 6800,
 'How to Prepare for IELTS from Bangladesh | EduBD Blog',
 'Complete guide to IELTS preparation from Bangladesh. Proven strategies to score 7.0+.',
 'IELTS preparation Bangladesh', 82, 1400,
 DATE_SUB(NOW(), INTERVAL 20 DAY), NOW(), NOW()),

(3, 1, 1, 'Complete Guide to Freelancing from Bangladesh on Fiverr', 'freelancing-bangladesh-fiverr-guide',
 'How to start and grow a successful freelancing career from Bangladesh using Fiverr.',
 '<p>Freelancing from Bangladesh is now easier than ever. Here is your complete guide...</p>',
 'published', 9, 8100,
 'Freelancing from Bangladesh on Fiverr: Complete Guide | EduBD',
 'Start and grow a successful freelancing career from Bangladesh. Step-by-step Fiverr guide.',
 'freelancing Bangladesh Fiverr', 85, 1800,
 DATE_SUB(NOW(), INTERVAL 30 DAY), NOW(), NOW()),

(4, 1, 2, 'bKash vs Nagad: Which is Better for Online Payments?', 'bkash-vs-nagad-comparison-2025',
 'A detailed comparison of bKash and Nagad for online payments, freelancing, and e-commerce.',
 '<p>Both bKash and Nagad are excellent mobile banking options in Bangladesh...</p>',
 'draft', 4, 0, NULL, NULL, NULL, 0, 0,
 NULL, NOW(), NOW());

INSERT INTO site_settings (`key`, value, type, `group`, label, created_at, updated_at) VALUES
('site_name',          'EduBD',                                           'string',  'general', 'Site Name',          NOW(), NOW()),
('site_tagline',       'Bangladesh''s #1 Online Learning Platform',        'string',  'general', 'Tagline',            NOW(), NOW()),
('site_email',         'support@edubd.com',                               'string',  'general', 'Support Email',      NOW(), NOW()),
('site_phone',         '+880 1700-000000',                                'string',  'general', 'Phone',              NOW(), NOW()),
('maintenance_mode',   '0',                                               'boolean', 'general', 'Maintenance Mode',   NOW(), NOW()),
('bkash_enabled',      '1',                                               'boolean', 'payment', 'bKash Enabled',      NOW(), NOW()),
('nagad_enabled',      '1',                                               'boolean', 'payment', 'Nagad Enabled',      NOW(), NOW()),
('sslcommerz_enabled', '1',                                               'boolean', 'payment', 'SSLCommerz Enabled', NOW(), NOW()),
('currency',           'BDT',                                             'string',  'payment', 'Currency',           NOW(), NOW()),
('meta_title',         'EduBD — Bangladesh''s #1 Online Learning Platform','string',  'seo',     'Default Meta Title', NOW(), NOW()),
('meta_description',   'Learn from Bangladesh''s top experts. 500+ courses.','string','seo',    'Meta Description',   NOW(), NOW()),
('google_analytics_id','',                                                'string',  'seo',     'GA ID',              NOW(), NOW()),
('mail_from_name',     'EduBD',                                           'string',  'email',   'Mail From Name',     NOW(), NOW()),
('mail_from_address',  'noreply@edubd.com',                               'string',  'email',   'Mail From Address',  NOW(), NOW());

SET FOREIGN_KEY_CHECKS = 1;