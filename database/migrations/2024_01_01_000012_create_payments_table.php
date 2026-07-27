<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 10, 2)->unsigned();
            $table->string('currency', 10)->default('BDT');
            $table->enum('gateway', ['bkash', 'nagad', 'sslcommerz', 'card', 'free'])
                  ->default('bkash');
            $table->string('transaction_id')->nullable()->unique(); // gateway txn ID
            $table->string('gateway_ref')->nullable();             // gateway internal ref
            $table->enum('status', ['pending', 'paid', 'failed', 'refunded', 'cancelled'])
                  ->default('pending');
            $table->json('gateway_response')->nullable();          // raw gateway response
            $table->string('coupon_code')->nullable();
            $table->decimal('discount_amount', 10, 2)->unsigned()->default(0);
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('refunded_at')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['gateway', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
