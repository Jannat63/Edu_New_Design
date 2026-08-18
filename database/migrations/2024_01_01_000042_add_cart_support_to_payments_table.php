<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Phase 6 item 20, UPGRADE_PLAN.md. A cart payment has course_id=bundle_id
// =NULL on the payments row itself and one payment_items row per
// course/bundle actually being purchased — deliberately NOT reusing
// course_id/bundle_id-on-payments for this, so the existing single-item
// code path in PaymentController::markPaid() (Phase 4's payment-integrity
// fixes included) stays completely untouched for every payment that isn't
// a cart checkout.
return new class extends Migration {
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->boolean('is_cart')->default(false)->after('bundle_id');
        });

        Schema::create('payment_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('bundle_id')->nullable()->constrained()->cascadeOnDelete();
            $table->decimal('amount', 10, 2)->unsigned();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_items');
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn('is_cart');
        });
    }
};
