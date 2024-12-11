<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::dropIfExists('orders');
        
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->string('customer_device_hash')->index();
            $table->string('customer_email')->nullable();
            $table->json('customer_info')->nullable();
            $table->text('notes')->nullable();
            $table->json('items');
            $table->decimal('total', 10, 2);
            $table->decimal('discount', 10, 2)->default(0);
            $table->string('payment_method')->default('paypal');
            $table->string('invoice_id')->nullable();
            $table->string('currency')->default('USD');
            $table->enum('payment_status', ['pending', 'processing', 'paid', 'failed', 'refunded'])->default('pending');
            $table->enum('status', ['pending', 'processing', 'completed', 'failed', 'cancelled'])->default('pending');
            $table->string('payment_id')->nullable();
            $table->string('payment_url')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->json('payment_metadata')->nullable();
            $table->enum('delivery_status', ['pending', 'processing', 'shipped', 'delivered', 'failed'])->default('pending');
            $table->json('delivery_messages')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // Set the auto-increment to start from 1026
        DB::statement('ALTER TABLE orders AUTO_INCREMENT = 1026');
    }

    public function down()
    {
        Schema::dropIfExists('orders');
    }
};
