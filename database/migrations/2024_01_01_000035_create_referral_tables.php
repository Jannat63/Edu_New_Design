<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('referral_code', 20)->nullable()->unique()->after('id');
            // Self-referencing FK — nullOnDelete (not cascade): if a referrer's
            // account is later deleted, the people they referred must stay
            // exactly as they are, just with the link cleared. A cascade here
            // would delete the referred user's account too, and transitively
            // anyone *they* referred — clearly wrong.
            $table->foreignId('referred_by_user_id')->nullable()->after('referral_code')
                ->constrained('users')->nullOnDelete();
        });

        // One row per commission-earning event (a paid enrollment/bundle
        // purchase by a referred user). Kept as an append-only ledger rather
        // than a running balance column on users — matches how the existing
        // instructor payout balance is computed (PayoutController::
        // availableBalance sums Enrollment rows fresh each time) rather than
        // trusting a cached counter that could drift out of sync.
        Schema::create('referral_commissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('referrer_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('referred_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('payment_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->decimal('rate_percent_at_time', 5, 2); // audit trail if the global rate changes later
            $table->timestamp('created_at')->nullable();

            $table->unique('payment_id'); // one commission per payment — also makes crediting idempotent
            $table->index('referrer_id');
        });

        // Mirrors the existing `payouts` table structure (see PayoutController)
        // deliberately as a separate table rather than reusing it: `payouts`
        // is keyed on instructor_id and its balance calculation is specific to
        // instructor course revenue. Referral commissions are a different
        // pool of money for a different (possibly overlapping) set of users;
        // keeping them separate avoids touching the existing, live instructor
        // payout code for an unrelated feature.
        Schema::create('referral_payouts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->enum('method', ['bkash', 'nagad', 'rocket', 'bank']);
            $table->string('account_number', 50);
            $table->enum('status', ['pending', 'processing', 'paid', 'rejected'])->default('pending');
            $table->text('note')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('referral_payouts');
        Schema::dropIfExists('referral_commissions');
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('referred_by_user_id');
            $table->dropColumn('referral_code');
        });
    }
};
