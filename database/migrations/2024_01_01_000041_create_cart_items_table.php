<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Phase 6 item 20, UPGRADE_PLAN.md. No DB-level unique constraint on
// (user_id, course_id, bundle_id) — MySQL treats each NULL as distinct in a
// unique index, so it wouldn't actually prevent duplicate (course_id=5,
// bundle_id=NULL) rows anyway. Duplicate-add prevention is handled in
// CartController instead (same call as the existing WishlistController
// pattern already uses for the same reason).
return new class extends Migration {
    public function up(): void
    {
        Schema::create('cart_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('bundle_id')->nullable()->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->index(['user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cart_items');
    }
};
