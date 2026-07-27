<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('coupons', function (Blueprint $table) {
            // NULL = a normal, publicly-shareable coupon (existing behavior,
            // unchanged for every coupon that already exists). Set = a
            // coupon generated for one specific person — currently used for
            // abandoned-checkout recovery emails, so the 10%-off code in
            // that email can't be copy-pasted and shared/leaked by someone
            // else who never started a checkout.
            $table->foreignId('user_id')->nullable()->after('course_id')
                  ->constrained()->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('coupons', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn('user_id');
        });
    }
};
