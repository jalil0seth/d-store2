<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->json('config')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        // Insert default PayPal configuration
        DB::table('payments')->insert([
            'name' => 'paypal',
            'config' => json_encode([
                'mode' => 'sandbox',
                'client_id' => 'AYSq3RDGsmBLJE-otTkBtM-jBRd1TCQwFf9RGfwddNXWz0uFU9ztymylOhRS',
                'client_secret' => 'EGnHDxD_qRPdaLdZz8iCr8N7_MzF-YHPTkjs6NKYQvQSBngp4PTTVWkPZRbL'
            ]),
            'active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);
    }

    public function down()
    {
        Schema::dropIfExists('payments');
    }
};
