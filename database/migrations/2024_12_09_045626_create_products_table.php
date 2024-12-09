<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('brand')->nullable();
            $table->string('category')->nullable();
            $table->string('type')->nullable();
            $table->string('collectionId')->nullable();
            $table->string('collectionName')->nullable();
            $table->boolean('featured')->default(false);
            $table->text('image')->nullable();
            $table->json('images')->nullable();
            $table->boolean('isAvailable')->default(true);
            $table->json('metadata')->nullable();
            $table->json('variants')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
