<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['name' => 'Admin',      'slug' => 'admin'],
            ['name' => 'Student',    'slug' => 'student'],
            ['name' => 'Instructor', 'slug' => 'instructor'],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(['slug' => $role['slug']], $role);
        }

        $this->command->info('Roles seeded.');
    }
}

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $adminRole      = Role::where('slug', 'admin')->first()->id;
        $studentRole    = Role::where('slug', 'student')->first()->id;
        $instructorRole = Role::where('slug', 'instructor')->first()->id;

        // ── ADMIN ─────────────────────────────────────────────────────────────
        User::updateOrCreate(['email' => 'admin@edubd.com'], [
            'role_id'           => $adminRole,
            'name'              => 'EduBD Admin',
            'phone'             => '01700000000',
            'city'              => 'Dhaka',
            'password'          => Hash::make('password'),
            'email_verified_at' => now(),
        ]);

        // ── INSTRUCTORS ───────────────────────────────────────────────────────
        $instructors = [
            ['name' => 'Tanvir Ahmed',      'email' => 'tanvir@edubd.com',    'phone' => '01711111111', 'city' => 'Dhaka',      'bio' => 'Senior React & Next.js developer with 10+ years of experience.'],
            ['name' => 'Dr. Nasrin Khatun', 'email' => 'nasrin@edubd.com',    'phone' => '01722222222', 'city' => 'Dhaka',      'bio' => 'PhD in Computer Science, specializing in ML & data science.'],
            ['name' => 'Kabir Hossain',     'email' => 'kabir@edubd.com',     'phone' => '01733333333', 'city' => 'Chittagong', 'bio' => 'IELTS 9.0 scorer, certified British Council trainer.'],
            ['name' => 'Fatema Begum',      'email' => 'fatema@edubd.com',    'phone' => '01744444444', 'city' => 'Dhaka',      'bio' => 'UI/UX designer with 8 years at leading BD tech companies.'],
            ['name' => 'Sabbir Rahman',     'email' => 'sabbir@edubd.com',    'phone' => '01755555555', 'city' => 'Sylhet',     'bio' => 'Digital marketing strategist managing ৳1cr+ ad budgets.'],
            ['name' => 'Mohammed Ali',      'email' => 'mali@edubd.com',      'phone' => '01766666666', 'city' => 'Rajshahi',   'bio' => 'Chartered Accountant with 15 years in corporate finance.'],
        ];

        foreach ($instructors as $ins) {
            User::updateOrCreate(['email' => $ins['email']], array_merge($ins, [
                'role_id'           => $instructorRole,
                'password'          => Hash::make('password'),
                'email_verified_at' => now(),
            ]));
        }

        // ── STUDENTS ──────────────────────────────────────────────────────────
        $students = [
            ['name' => 'Rafiqul Islam',  'email' => 'rafiq@gmail.com',    'phone' => '01811111111', 'city' => 'Dhaka'],
            ['name' => 'Fatima Akter',   'email' => 'fatima@gmail.com',   'phone' => '01822222222', 'city' => 'Chittagong'],
            ['name' => 'Karim Ahmed',    'email' => 'karim@gmail.com',    'phone' => '01833333333', 'city' => 'Sylhet'],
            ['name' => 'Rina Parvin',    'email' => 'rina@gmail.com',     'phone' => '01844444444', 'city' => 'Khulna'],
            ['name' => 'Sumaiya Islam',  'email' => 'sumaiya@gmail.com',  'phone' => '01855555555', 'city' => 'Dhaka'],
            ['name' => 'Rahim Uddin',    'email' => 'rahim@gmail.com',    'phone' => '01866666666', 'city' => 'Rajshahi'],
            ['name' => 'Nadia Hossain',  'email' => 'nadia@gmail.com',    'phone' => '01877777777', 'city' => 'Barisal'],
            ['name' => 'Arif Hasan',     'email' => 'arif@gmail.com',     'phone' => '01888888888', 'city' => 'Mymensingh'],
        ];

        foreach ($students as $s) {
            User::updateOrCreate(['email' => $s['email']], array_merge($s, [
                'role_id'           => $studentRole,
                'password'          => Hash::make('password'),
                'email_verified_at' => now(),
            ]));
        }

        $this->command->info('Users seeded: 1 admin, 6 instructors, 8 students.');
    }
}
