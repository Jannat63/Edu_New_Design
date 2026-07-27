<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('menu_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('parent_id')->nullable()->index(); // null = top-level
            $table->string('title');
            $table->string('url')->nullable();
            $table->string('icon')->nullable();               // lucide icon name or emoji
            $table->string('category_group')->nullable();     // grouping label in mega menu
            $table->boolean('is_featured')->default(false);   // highlight in mega menu
            $table->boolean('is_active')->default(true);
            $table->boolean('open_new_tab')->default(false);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->foreign('parent_id')->references('id')->on('menu_items')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_items');
    }
};
