<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->foreignId('instructor_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('subtitle')->nullable();
            $table->longText('description')->nullable();
            $table->string('thumbnail')->nullable();       // path to Cloudflare R2
            $table->string('preview_video')->nullable();   // Bunny Stream video ID
            $table->string('language', 50)->default('Bengali & English');
            $table->enum('level', ['Beginner', 'Intermediate', 'Advanced', 'All Levels'])->default('Beginner');
            $table->decimal('price', 10, 2)->unsigned()->default(0);
            $table->decimal('discount_price', 10, 2)->unsigned()->nullable();
            $table->decimal('average_rating', 3, 2)->unsigned()->default(0.00);
            $table->unsignedInteger('total_reviews')->default(0);
            $table->unsignedInteger('total_students')->default(0);
            $table->unsignedInteger('total_lessons')->default(0);
            $table->unsignedInteger('total_duration_minutes')->default(0);
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
            $table->json('requirements')->nullable();       // JSON array
            $table->json('what_you_learn')->nullable();    // JSON array
            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['status', 'category_id']);
            $table->index('slug');
            $table->fullText(['title', 'subtitle']);        // full-text search
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('courses');
    }
};
