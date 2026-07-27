<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('assignment_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assignment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->string('file_path')->nullable();
            $table->string('file_name')->nullable();
            $table->string('file_size')->nullable();         // human-readable e.g. "2.4 MB"
            $table->text('notes')->nullable();               // student notes
            $table->unsignedSmallInteger('score')->nullable();
            $table->text('feedback')->nullable();            // instructor feedback
            $table->enum('status', ['pending','graded','returned'])->default('pending');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('graded_at')->nullable();
            $table->foreignId('graded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['assignment_id','user_id']); // one submission per student
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assignment_submissions');
    }
};
