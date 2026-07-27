<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('payment_methods', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['bank', 'mobile', 'card', 'other'])->default('mobile');
            $table->string('name');                         // e.g. "bKash", "Dutch-Bangla Bank"
            $table->string('account_name')->nullable();
            $table->string('account_number')->nullable();
            $table->string('routing_number')->nullable();   // for bank accounts
            $table->string('logo')->nullable();             // storage path to uploaded logo
            $table->text('instructions')->nullable();       // payment instructions shown to user
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_methods');
    }
};
