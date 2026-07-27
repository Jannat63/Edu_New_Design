<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::statement("ALTER TABLE lessons MODIFY COLUMN `type` ENUM('video','quiz','resource','text','assignment') DEFAULT 'video'");
    }

    public function down(): void
    {
        // Remove any assignment lessons before reverting enum
        DB::statement("UPDATE lessons SET `type` = 'text' WHERE `type` = 'assignment'");
        DB::statement("ALTER TABLE lessons MODIFY COLUMN `type` ENUM('video','quiz','resource','text') DEFAULT 'video'");
    }
};
