<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Course and blog post SEO stay with their own entity, edited in their own
// admin section (Course Management / Blog Management) — this is deliberate,
// not the same thing as the separate SEO admin section being added for
// static pages that have no entity of their own (Home, About, etc.). See
// UPGRADE_PLAN.md Phase 6 item 19 for the distinction. Courses already had
// meta_title/meta_description; blog_posts already had those plus og_image
// (add_seo_fields_to_blog_posts migration) — this brings courses to parity
// on og_image and adds faqs to both, since neither had it.
return new class extends Migration {
    public function up(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->json('faqs')->nullable()->after('what_you_learn'); // [{question, answer}, ...]
            $table->string('og_image')->nullable()->after('meta_description');
        });

        Schema::table('blog_posts', function (Blueprint $table) {
            $table->json('faqs')->nullable()->after('meta_description'); // [{question, answer}, ...]
        });
    }

    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->dropColumn(['faqs', 'og_image']);
        });

        Schema::table('blog_posts', function (Blueprint $table) {
            $table->dropColumn('faqs');
        });
    }
};
