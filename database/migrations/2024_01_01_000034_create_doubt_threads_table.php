<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // One thread per (user, lesson) — the AI doubt-solving assistant's
        // conversation history for that student on that specific lesson.
        // Kept separate from the messages table so we can cheaply list "which
        // lessons has this student asked about" without scanning messages.
        Schema::create('doubt_threads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lesson_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'lesson_id']);
        });

        Schema::create('doubt_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doubt_thread_id')->constrained()->cascadeOnDelete();
            $table->enum('role', ['user', 'assistant']);
            $table->longText('content');
            // Populated only for role=assistant — lets us show a quiet "the
            // transcript for this lesson isn't available yet" hint in the UI
            // instead of silently letting a video-lesson answer look as
            // confident as a text-lesson one grounded in real material.
            $table->boolean('grounded_in_transcript')->default(false);
            $table->timestamp('created_at')->nullable();

            $table->index(['doubt_thread_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('doubt_messages');
        Schema::dropIfExists('doubt_threads');
    }
};
