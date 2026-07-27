<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            // NULL = available immediately (the existing behavior for every
            // lesson that already exists — this migration changes nothing
            // for them). A future timestamp = the lesson stays locked for
            // enrolled students (instructors/admins can still preview it)
            // until that moment, e.g. "release module 2 one week after
            // enrollment" or a fixed calendar date for a cohort-style course.
            $table->timestamp('available_at')->nullable()->after('is_preview');
            $table->index(['course_id', 'available_at']);
        });
    }

    public function down(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->dropIndex(['course_id', 'available_at']);
            $table->dropColumn('available_at');
        });
    }
};
