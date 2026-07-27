<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('lessons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('section_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->enum('type', ['video', 'quiz', 'resource', 'text'])->default('video');
            $table->string('video_url')->nullable();       // Bunny Stream video ID
            $table->string('video_thumbnail')->nullable();
            $table->unsignedInteger('duration_seconds')->default(0);
            $table->longText('content')->nullable();       // for text lessons
            $table->json('resources')->nullable();         // downloadable files JSON
            $table->boolean('is_preview')->default(false); // free preview?
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['section_id', 'sort_order']);
            $table->index(['course_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lessons');
    }
};
