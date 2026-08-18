<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(SiteContentSeeder::class);
        $this->call([
            RoleSeeder::class,
            UserSeeder::class,
            CategorySeeder::class,
            CourseSeeder::class,
            SectionLessonSeeder::class,
            QuizSeeder::class,
            EnrollmentSeeder::class,
            PaymentSeeder::class,
            ReviewSeeder::class,
            CertificateSeeder::class,
            BlogSeeder::class,
            SiteSettingSeeder::class,
            BadgeSeeder::class,
            MenuItemSeeder::class,
        ]);

        $this->command->info('✅ EduBD database seeded successfully!');
    }
}
