<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('user_streaks', function (Blueprint $table) {
            $table->foreignId('user_id')->primary()->constrained()->cascadeOnDelete();
            $table->unsignedInteger('current_streak')->default(0);
            $table->unsignedInteger('longest_streak')->default(0);
            $table->date('last_activity_date')->nullable();
            $table->timestamps();
        });

        Schema::create('badges', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique(); // stable slug, safe to reference in code
            $table->string('name');
            $table->string('description');
            $table->string('icon'); // lucide-react icon name, mirrors categories.icon convention
            $table->enum('criteria_type', ['lessons_completed', 'streak_days', 'courses_completed']);
            $table->unsignedInteger('criteria_value');
            $table->unsignedInteger('sort_order')->default(0);
        });

        Schema::create('user_badges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('badge_id')->constrained()->cascadeOnDelete();
            $table->timestamp('earned_at')->useCurrent();

            $table->unique(['user_id', 'badge_id']); // also makes awarding idempotent
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_badges');
        Schema::dropIfExists('badges');
        Schema::dropIfExists('user_streaks');
    }
};
