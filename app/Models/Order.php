<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    use HasFactory, SoftDeletes;

    const STATUS_PENDING = 'pending';
    const STATUS_PROCESSING = 'processing';
    const STATUS_PAID = 'paid';
    const STATUS_FAILED = 'failed';
    const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'order_number',
        'customer_email',
        'customer_info',
        'notes',
        'items',
        'total',
        'status',
        'payment_method',
        'invoice_id',
        'currency',
        'payment_status',
        'customer_device_hash',
        'discount',
        'delivery_status',
        'delivery_messages',
        'payment_metadata',
        'payment_id',
        'payment_url',
        'paid_at'
    ];

    protected $casts = [
        'items' => 'json',
        'total' => 'decimal:2',
        'customer_info' => 'json',
        'delivery_messages' => 'json',
        'payment_metadata' => 'json',
        'discount' => 'decimal:2',
        'paid_at' => 'datetime'
    ];

    protected $attributes = [
        'currency' => 'USD',
        'payment_status' => self::STATUS_PENDING,
        'status' => self::STATUS_PENDING,
        'customer_email' => '',
        'notes' => '',
        'discount' => 0
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($order) {
            if (!$order->order_number) {
                $order->order_number = 'ORD-' . strtoupper(uniqid());
            }
        });
    }

    public function calculateTotal()
    {
        return collect($this->items)->sum(function ($item) {
            return $item['variant']['price'] * $item['quantity'];
        });
    }

    public function addItem($variant)
    {
        $items = $this->items ?? [];
        
        $item = [
            'id' => $variant->id,
            'name' => $variant->product->name,
            'image' => $variant->product->image,
            'price' => $variant->price,
            'variant' => [
                'name' => $variant->name,
                'price' => $variant->price
            ],
            'quantity' => 1,
            'description' => $variant->product->description,
            'variant_originalPrice' => $variant->original_price,
            'variant_price' => $variant->price,
            'variant_quantity' => 1,
            'variant_id' => $variant->id,
            'variant_name' => $variant->name
        ];

        $items[] = $item;
        $this->items = $items;
        $this->total = $this->calculateTotal();
        $this->save();
    }

    public function markAsPaid()
    {
        $this->update([
            'payment_status' => self::STATUS_PAID,
            'status' => self::STATUS_PAID
        ]);
    }

    public function markAsProcessing()
    {
        $this->update([
            'payment_status' => self::STATUS_PROCESSING,
            'status' => self::STATUS_PROCESSING
        ]);
    }

    public function markAsFailed()
    {
        $this->update([
            'payment_status' => self::STATUS_FAILED,
            'status' => self::STATUS_FAILED
        ]);
    }

    public function markAsCancelled()
    {
        $this->update([
            'payment_status' => self::STATUS_CANCELLED,
            'status' => self::STATUS_CANCELLED
        ]);
    }

    public function isPaid()
    {
        return $this->payment_status === self::STATUS_PAID;
    }

    public function isPending()
    {
        return $this->payment_status === self::STATUS_PENDING;
    }

    public function isProcessing()
    {
        return $this->payment_status === self::STATUS_PROCESSING;
    }

    public function isFailed()
    {
        return $this->payment_status === self::STATUS_FAILED;
    }

    public function isCancelled()
    {
        return $this->payment_status === self::STATUS_CANCELLED;
    }

    public static function rules()
    {
        return [
            'customer_email' => 'required|email',
            'items' => 'required|array',
            'items.*.id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'total' => 'required|numeric|min:0',
            'discount' => 'nullable|numeric|min:0'
        ];
    }
}
