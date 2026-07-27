<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount_paid', 10, 2)->unsigned()->default(0);
            $table->unsignedTinyInteger('progress_pct')->default(0);    // 0–100
            $table->unsignedInteger('completed_lessons')->default(0);
            $table->foreignId('last_lesson_id')->nullable()->constrained('lessons')->nullOnDelete();
            $table->timestamp('enrolled_at')->useCurrent();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'course_id']);  // one enrollment per course
            $table->index(['user_id', 'progress_pct']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('enrollments');
    }
};
