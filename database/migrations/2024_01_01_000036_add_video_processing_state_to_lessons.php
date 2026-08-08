<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            // `video_url` already exists and holds the final PLAYBACK url once
            // ready (kept as-is — CourseCurriculumController's manual-paste
            // "Video URL" field already writes plain URLs there, so changing
            // its meaning would break that existing path). This column is new:
            // it holds Bunny Stream's own video GUID, needed to poll processing
            // status and to delete the remote video if the lesson is removed —
            // distinct from video_url because the GUID is not itself a playable
            // link (see BunnyStreamService).
            $table->string('video_provider_id')->nullable()->after('video_url');
            $table->enum('video_status', ['none', 'uploading', 'processing', 'ready', 'error'])
                ->default('none')->after('video_provider_id');
        });
    }

    public function down(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->dropColumn(['video_provider_id', 'video_status']);
        });
    }
};
