<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'order_number',
        'customer_device_hash',
        'email',
        'customer_info',
        'notes',
        'items',
        'total',
        'discount',
        'payment_status',
        'payment_metadata',
        'delivery_status',
        'delivery_messages',
        'payment_id',
        'payment_url',
        'paid_at'
    ];

    protected $casts = [
        'items' => 'array',
        'customer_info' => 'array',
        'payment_metadata' => 'array',
        'delivery_messages' => 'array',
        'total' => 'decimal:2',
        'discount' => 'decimal:2',
        'paid_at' => 'datetime'
    ];

    protected static function boot()
    {
        parent::boot();

        // Auto-generate order number when creating a new order
        static::creating(function ($order) {
            if (!$order->order_number) {
                $order->order_number = 'ORD-' . strtoupper(uniqid());
            }
        });
    }
}
