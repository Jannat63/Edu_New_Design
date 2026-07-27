<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SiteSetting;

class SiteContentSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            // ── General ──────────────────────────────────────────────────────
            ['key'=>'site_name',        'value'=>'EduBD',                                'type'=>'string', 'group'=>'general', 'label'=>'Site Name'],
            ['key'=>'site_tagline',     'value'=>'Bangladesh\'s #1 Online Learning Platform', 'type'=>'string', 'group'=>'general', 'label'=>'Tagline'],
            ['key'=>'support_email',    'value'=>'support@edubd.com',                    'type'=>'string', 'group'=>'general', 'label'=>'Support Email'],
            ['key'=>'support_phone',    'value'=>'+880 1800-000000',                     'type'=>'string', 'group'=>'general', 'label'=>'Support Phone'],
            ['key'=>'support_address',  'value'=>'Dhaka, Bangladesh',                    'type'=>'string', 'group'=>'general', 'label'=>'Address'],
            ['key'=>'site_logo',        'value'=>null,                                   'type'=>'string', 'group'=>'general', 'label'=>'Logo'],
            ['key'=>'favicon',          'value'=>null,                                   'type'=>'string', 'group'=>'general', 'label'=>'Favicon'],
            ['key'=>'maintenance_mode', 'value'=>'0',                                    'type'=>'boolean','group'=>'general', 'label'=>'Maintenance Mode'],

            // ── Hero / Banner ─────────────────────────────────────────────────
            ['key'=>'hero_title',       'value'=>'Learn Skills That Shape Your Future',  'type'=>'string', 'group'=>'hero', 'label'=>'Hero Title'],
            ['key'=>'hero_subtitle',    'value'=>'Join 50,000+ students learning with Bangladesh\'s top instructors.', 'type'=>'text', 'group'=>'hero', 'label'=>'Hero Subtitle'],
            ['key'=>'hero_cta_text',    'value'=>'Explore Courses',                      'type'=>'string', 'group'=>'hero', 'label'=>'CTA Button Text'],
            ['key'=>'hero_cta_url',     'value'=>'/courses',                             'type'=>'string', 'group'=>'hero', 'label'=>'CTA Button URL'],
            ['key'=>'hero_image',       'value'=>null,                                   'type'=>'string', 'group'=>'hero', 'label'=>'Hero Background Image'],
            ['key'=>'hero_video_url',   'value'=>null,                                   'type'=>'string', 'group'=>'hero', 'label'=>'Hero Video URL'],

            // ── About Us ─────────────────────────────────────────────────────
            ['key'=>'about_title',      'value'=>'About EduBD',                          'type'=>'string', 'group'=>'about', 'label'=>'Page Title'],
            ['key'=>'about_content',    'value'=>'EduBD is Bangladesh\'s leading online education platform...', 'type'=>'text', 'group'=>'about', 'label'=>'Content'],
            ['key'=>'about_image',      'value'=>null,                                   'type'=>'string', 'group'=>'about', 'label'=>'Feature Image'],

            // ── Mission & Vision ──────────────────────────────────────────────
            ['key'=>'mission_title',    'value'=>'Our Mission',                          'type'=>'string', 'group'=>'mission', 'label'=>'Mission Title'],
            ['key'=>'mission_content',  'value'=>'To make quality education accessible to every student in Bangladesh.', 'type'=>'text', 'group'=>'mission', 'label'=>'Mission Content'],
            ['key'=>'vision_title',     'value'=>'Our Vision',                           'type'=>'string', 'group'=>'mission', 'label'=>'Vision Title'],
            ['key'=>'vision_content',   'value'=>'A Bangladesh where every learner can reach their full potential through digital education.', 'type'=>'text', 'group'=>'mission', 'label'=>'Vision Content'],

            // ── Why Choose Us ─────────────────────────────────────────────────
            ['key'=>'why_us_title',     'value'=>'Why Choose EduBD?',                   'type'=>'string', 'group'=>'why_us', 'label'=>'Section Title'],
            ['key'=>'why_us_items',     'value'=>json_encode([
                ['icon'=>'GraduationCap','title'=>'Expert Instructors','desc'=>'Handpicked local & global experts with real-world experience.'],
                ['icon'=>'BadgeCheck',   'title'=>'Verified Certificates','desc'=>'Industry-recognised certificates with unique verify codes.'],
                ['icon'=>'Zap',          'title'=>'bKash & Nagad Payments','desc'=>'Pay instantly with bKash, Nagad, or SSLCommerz.'],
                ['icon'=>'Clock',        'title'=>'Lifetime Access','desc'=>'Buy once, access forever on any device.'],
            ]), 'type'=>'json', 'group'=>'why_us', 'label'=>'Feature Items'],

            // ── Statistics ───────────────────────────────────────────────────
            ['key'=>'stats_items', 'value'=>json_encode([
                ['value'=>'500+',   'label'=>'Courses'],
                ['value'=>'50,000+','label'=>'Students'],
                ['value'=>'200+',   'label'=>'Instructors'],
                ['value'=>'4.8★',   'label'=>'Average Rating'],
            ]), 'type'=>'json', 'group'=>'stats', 'label'=>'Statistics'],

            // ── Social Media ──────────────────────────────────────────────────
            ['key'=>'social_facebook',  'value'=>'https://facebook.com/edubd',           'type'=>'string', 'group'=>'social', 'label'=>'Facebook URL'],
            ['key'=>'social_youtube',   'value'=>'https://youtube.com/edubd',            'type'=>'string', 'group'=>'social', 'label'=>'YouTube URL'],
            ['key'=>'social_twitter',   'value'=>'',                                     'type'=>'string', 'group'=>'social', 'label'=>'Twitter/X URL'],
            ['key'=>'social_instagram', 'value'=>'',                                     'type'=>'string', 'group'=>'social', 'label'=>'Instagram URL'],
            ['key'=>'social_linkedin',  'value'=>'',                                     'type'=>'string', 'group'=>'social', 'label'=>'LinkedIn URL'],

            // ── Footer ───────────────────────────────────────────────────────
            ['key'=>'footer_about',     'value'=>'Bangladesh\'s leading online education platform with 500+ courses.', 'type'=>'text', 'group'=>'footer', 'label'=>'Footer About Text'],
            ['key'=>'footer_copyright', 'value'=>'© 2025 EduBD. All rights reserved.',  'type'=>'string', 'group'=>'footer', 'label'=>'Copyright Text'],

            // ── FAQ ──────────────────────────────────────────────────────────
            ['key'=>'faq_title',        'value'=>'Frequently Asked Questions',           'type'=>'string', 'group'=>'faq', 'label'=>'FAQ Section Title'],
            ['key'=>'faq_items',        'value'=>json_encode([
                ['q'=>'How do I enroll in a course?',   'a'=>'Click the Enroll button on any course page and complete the payment via bKash, Nagad, or SSLCommerz.'],
                ['q'=>'Do I get a certificate?',        'a'=>'Yes! After completing a course and passing the quiz, a PDF certificate is automatically generated for you.'],
                ['q'=>'Can I access courses offline?',  'a'=>'Currently courses require an internet connection, but you can download resources attached to each lesson.'],
                ['q'=>'What payment methods are accepted?', 'a'=>'We accept bKash, Nagad, Rocket, and SSLCommerz (Visa/Mastercard).'],
            ]), 'type'=>'json', 'group'=>'faq', 'label'=>'FAQ Items'],

            // ── Legal ─────────────────────────────────────────────────────────
            ['key'=>'terms_content',    'value'=>'# Terms & Conditions\n\nPlease read these terms carefully before using EduBD...', 'type'=>'text', 'group'=>'legal', 'label'=>'Terms & Conditions'],
            ['key'=>'privacy_content',  'value'=>'# Privacy Policy\n\nYour privacy is important to us...', 'type'=>'text', 'group'=>'legal', 'label'=>'Privacy Policy'],
        ];

        foreach ($settings as $s) {
            $existing = SiteSetting::where('key', $s['key'])->first();

            if ($existing) {
                // Row already exists — an admin may have customized its value
                // through the CMS panel. Only refresh metadata (label/type/
                // group), never touch 'value', so re-running this seeder
                // after every update.sh can NEVER reset someone's site name,
                // hero text, etc. back to the default.
                $existing->update([
                    'type'  => $s['type'],
                    'group' => $s['group'],
                    'label' => $s['label'],
                ]);
            } else {
                // Brand new key (e.g. added in a later update) — safe to
                // create with its default value.
                SiteSetting::create($s);
            }
        }

        $this->command->info('Site content seeded (' . count($settings) . ' settings).');
    }
}
