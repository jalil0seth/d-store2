<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\DB;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'config',
        'active'
    ];

    protected $casts = [
        'config' => 'json',
        'active' => 'boolean'
    ];

    public static function getPayPalConfig()
    {
        $payment = self::where('name', 'paypal')->where('active', true)->first();
        
        if (!$payment) {
            // Create default PayPal configuration if it doesn't exist
            $payment = self::create([
                'name' => 'paypal',
                'config' => [
                    'mode' => env('PAYPAL_MODE', 'sandbox'),
                    'client_id' => env('PAYPAL_SANDBOX_CLIENT_ID'),
                    'client_secret' => env('PAYPAL_SANDBOX_SECRET')
                ],
                'active' => true
            ]);
        }

        return $payment->config;
    }
}