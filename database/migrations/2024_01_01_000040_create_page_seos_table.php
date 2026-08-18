<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// A separate, general-purpose SEO system for every page that ISN'T a course
// or blog post — those two manage their own SEO fields within their own
// admin sections (Course Management / Blog Management; see the migration
// alongside item 19's courses/blog_posts changes). Static/listing pages
// (Home, About, Contact, the Courses listing, etc.) have no entity of their
// own to hang meta fields off, so this is keyed by URL path instead of by a
// model — one admin screen manages SEO for all of them, the way a
// storefront platform like nopCommerce separates catalog-entity SEO from
// general page/URL SEO. UPGRADE_PLAN.md Phase 6 item 19.
return new class extends Migration {
    public function up(): void
    {
        Schema::create('page_seos', function (Blueprint $table) {
            $table->id();
            $table->string('path')->unique();     // e.g. '/', '/about', '/courses'
            $table->string('label')->nullable();   // human-friendly name for the admin list
            $table->string('meta_title')->nullable();
            $table->string('meta_description', 500)->nullable();
            $table->string('og_image')->nullable();
            $table->json('faqs')->nullable();      // [{question, answer}, ...]
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('page_seos');
    }
};
