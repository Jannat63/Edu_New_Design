<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('live_classes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('instructor_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->dateTime('scheduled_at');
            $table->unsignedInteger('duration_minutes')->default(60);
            // Daily.co room — not the join URL itself, since a private
            // room's real join link needs a fresh signed token per user
            // (see DailyCoService::createMeetingToken), not a static url.
            $table->string('room_name')->unique();
            $table->enum('status', ['scheduled', 'cancelled', 'ended'])->default('scheduled');
            $table->timestamps();

            $table->index(['course_id', 'scheduled_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('live_classes');
    }
};
