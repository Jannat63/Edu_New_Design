<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            // A payment is for EITHER a single course OR a bundle, never both —
            // enforced in PaymentController::initiate(), not at the DB level
            // (MySQL has no portable XOR-of-two-columns check constraint).
            $table->foreignId('bundle_id')->nullable()->after('course_id')
                  ->constrained()->nullOnDelete();
            $table->index(['bundle_id', 'status']);
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->foreignId('course_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropForeign(['bundle_id']);
            $table->dropIndex(['bundle_id', 'status']);
            $table->dropColumn('bundle_id');
            $table->foreignId('course_id')->nullable(false)->change();
        });
    }
};
