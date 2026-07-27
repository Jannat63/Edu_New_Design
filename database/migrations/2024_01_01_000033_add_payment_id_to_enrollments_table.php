<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bug fix: AdminController::refundPayment() had no reliable way to know which
 * enrollments resulted from which payment — there was simply no foreign key
 * connecting the two tables. For single-course payments this didn't matter
 * (the payment's own course_id was enough), but for bundle payments it meant
 * a refund could only guess, and a naive guess risks revoking access to a
 * course the student legitimately owns from a *different*, earlier purchase
 * that happens to also be in this bundle.
 *
 * This column is nullable because free-course enrollments (price <= 0) are
 * created directly in CourseController::enroll() without ever creating a
 * Payment row at all — there's nothing to link to, and that's fine.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            $table->foreignId('payment_id')->nullable()->after('course_id')
                ->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropForeign(['payment_id']);
            $table->dropColumn('payment_id');
        });
    }
};
