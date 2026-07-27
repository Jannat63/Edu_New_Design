<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // ── QUIZZES ───────────────────────────────────────────────────────────
        Schema::create('quizzes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lesson_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->unsignedTinyInteger('pass_percentage')->default(70); // 70% to pass
            $table->unsignedTinyInteger('attempts_allowed')->default(3); // 0 = unlimited
            $table->unsignedInteger('time_limit_minutes')->default(0);   // 0 = no limit
            $table->boolean('show_answers')->default(true);
            $table->timestamps();
        });

        // ── QUESTIONS ─────────────────────────────────────────────────────────
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_id')->constrained()->cascadeOnDelete();
            $table->text('question_text');
            $table->enum('type', ['mcq', 'true_false', 'fill_blank'])->default('mcq');
            $table->text('explanation')->nullable(); // shown after answering
            $table->unsignedInteger('points')->default(1);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        // ── QUESTION OPTIONS ──────────────────────────────────────────────────
        Schema::create('question_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_id')->constrained()->cascadeOnDelete();
            $table->string('option_text');
            $table->boolean('is_correct')->default(false);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        // ── QUIZ RESULTS ──────────────────────────────────────────────────────
        Schema::create('quiz_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('quiz_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('score_percentage');  // 0–100
            $table->unsignedInteger('score_points')->default(0);
            $table->unsignedInteger('total_points')->default(0);
            $table->boolean('passed')->default(false);
            $table->unsignedTinyInteger('attempt_number')->default(1);
            $table->json('answers')->nullable();              // {question_id: option_id}
            $table->unsignedInteger('time_taken_seconds')->default(0);
            $table->timestamp('attempted_at')->useCurrent();
            $table->timestamps();

            $table->index(['user_id', 'quiz_id', 'passed']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_results');
        Schema::dropIfExists('question_options');
        Schema::dropIfExists('questions');
        Schema::dropIfExists('quizzes');
    }
};
