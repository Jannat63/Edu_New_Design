<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Add comprehensive SEO fields to blog_posts table.
     * Run: php artisan migrate
     */
    public function up(): void
    {
        Schema::table('blog_posts', function (Blueprint $table) {

            // ── ON-PAGE SEO ──────────────────────────────────────────────────
            $table->string('meta_title', 70)->nullable()->after('thumbnail')
                  ->comment('Google title tag — keep 30–60 chars');
            $table->text('meta_description')->nullable()->after('meta_title')
                  ->comment('Google snippet — keep 120–160 chars');
            $table->string('focus_keyword', 100)->nullable()->after('meta_description')
                  ->comment('Primary keyword this post targets');
            $table->json('secondary_keywords')->nullable()->after('focus_keyword')
                  ->comment('Array of secondary/LSI keywords');
            $table->string('canonical_url')->nullable()->after('secondary_keywords')
                  ->comment('Canonical URL — leave empty to auto-generate');

            // ── OPEN GRAPH (Facebook / LinkedIn) ─────────────────────────────
            $table->string('og_title')->nullable()->after('canonical_url')
                  ->comment('OG title — defaults to meta_title if empty');
            $table->text('og_description')->nullable()->after('og_title')
                  ->comment('OG description — defaults to meta_description if empty');
            $table->string('og_image')->nullable()->after('og_description')
                  ->comment('OG image path (1200×630px recommended)');
            $table->enum('og_type', ['article','website','product'])->default('article')->after('og_image');

            // ── TWITTER CARD ─────────────────────────────────────────────────
            $table->string('twitter_title')->nullable()->after('og_type')
                  ->comment('Twitter title — defaults to og_title');
            $table->text('twitter_description')->nullable()->after('twitter_title');
            $table->string('twitter_image')->nullable()->after('twitter_description')
                  ->comment('Twitter card image (2:1 ratio)');
            $table->enum('twitter_card_type', ['summary','summary_large_image'])->default('summary_large_image')->after('twitter_image');

            // ── SCHEMA / STRUCTURED DATA ─────────────────────────────────────
            $table->json('schema_markup')->nullable()->after('twitter_card_type')
                  ->comment('Custom JSON-LD schema override — leave empty for auto-generated');

            // ── INDEXING CONTROL ─────────────────────────────────────────────
            $table->boolean('is_noindex')->default(false)->after('schema_markup')
                  ->comment('Add noindex meta tag — set true for draft/thin content');
            $table->boolean('is_nofollow')->default(false)->after('is_noindex')
                  ->comment('Add nofollow to all links in this post');

            // ── BREADCRUMBS & INTERNAL LINKING ───────────────────────────────
            $table->string('breadcrumb_title')->nullable()->after('is_nofollow')
                  ->comment('Short title shown in breadcrumbs');
            $table->json('related_post_ids')->nullable()->after('breadcrumb_title')
                  ->comment('Array of related post IDs for internal linking');

            // ── PERFORMANCE METRICS (updated by admin) ───────────────────────
            $table->unsignedInteger('word_count')->default(0)->after('related_post_ids');
            $table->unsignedTinyInteger('seo_score')->default(0)->after('word_count')
                  ->comment('0–100 auto-calculated SEO score');
            $table->unsignedTinyInteger('readability_score')->default(0)->after('seo_score')
                  ->comment('0–100 readability score (Flesch-Kincaid adapted)');
        });
    }

    public function down(): void
    {
        Schema::table('blog_posts', function (Blueprint $table) {
            $table->dropColumn([
                'meta_title','meta_description','focus_keyword','secondary_keywords',
                'canonical_url','og_title','og_description','og_image','og_type',
                'twitter_title','twitter_description','twitter_image','twitter_card_type',
                'schema_markup','is_noindex','is_nofollow','breadcrumb_title',
                'related_post_ids','word_count','seo_score','readability_score',
            ]);
        });
    }
};
