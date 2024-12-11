<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Helpers\DeviceHash;
use App\Services\PayPalService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use App\Models\Payment;

class OrderController extends Controller
{
    protected $paypalService;

    public function __construct(PayPalService $paypalService)
    {
        $this->paypalService = $paypalService;
    }

    public function index(Request $request)
    {
        $deviceHash = DeviceHash::get();
        
        $orders = Order::where('customer_device_hash', $deviceHash)
            ->orderBy('created_at', 'desc')
            ->paginate(10);
            
        return response()->json($orders);
    }

    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'items' => 'required|array',
                'items.*.product_id' => 'required|string',
                'items.*.product_name' => 'required|string',
                'items.*.variant_name' => 'required|string',
                'items.*.variant_id' => 'required|string',
                'items.*.product_image' => 'required|string',
                'items.*.variant_price' => 'required|numeric',
                'items.*.variant_original_price' => 'required|numeric',
                'items.*.variant_quantity' => 'required|integer|min:0',
                'items.*.quantity' => 'required|integer|min:1',
                'total' => 'required|numeric|min:0',
                'email' => 'required|email',
                'customer_info' => 'required|array',
                'customer_info.name' => 'required|string',
                'discount' => 'nullable|numeric|min:0',
                'customer_device_hash' => 'required|string'
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            // Validate that each item's variant quantity is sufficient
            foreach ($request->items as $item) {
                if ($item['quantity'] > $item['variant_quantity']) {
                    return response()->json([
                        'error' => "Insufficient stock for {$item['product_name']} - {$item['variant_name']}"
                    ], 422);
                }
            }

            // Get active PayPal payment config
            $paypalPayment = Payment::where('name', 'paypal')
                ->where('active', true)
                ->first();

            if (!$paypalPayment) {
                throw new \Exception('PayPal payment configuration not found');
            }

            $order = Order::create([
                'customer_email' => $request->email,
                'customer_info' => $request->customer_info,
                'items' => $request->items,
                'total' => $request->total,
                'discount' => $request->discount ?? 0,
                'payment_status' => 'pending',
                'delivery_status' => 'pending',
                'payment_id' => $paypalPayment->id,
                'customer_device_hash' => $request->customer_device_hash
            ]);

            // Create PayPal invoice
            try {
                $result = $this->paypalService->createInvoice(
                    $order->total,
                    $order->id,
                    $order->customer_email
                );

                $order->update([
                    'invoice_id' => $result['id'],
                    'payment_url' => $result['url'],
                    'payment_metadata' => [
                        'invoice_id' => $result['id'],
                        'created_at' => now(),
                        'provider' => 'paypal'
                    ]
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to create PayPal invoice:', [
                    'order_id' => $order->id,
                    'error' => $e->getMessage()
                ]);
            }

            return response()->json($order, 201);

        } catch (\Exception $e) {
            Log::error('Order creation failed:', [
                'error' => $e->getMessage(),
                'request_data' => $request->all()
            ]);
            
            return response()->json([
                'error' => $e->getMessage()
            ], 400);
        }
    }

    public function show(Order $order, Request $request)
    {
        // Verify the order belongs to the current device
        if ($order->customer_device_hash !== $request->header('X-Device-Hash')) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        return response()->json($order);
    }

    public function updatePaymentStatus(Order $order, Request $request)
    {
        $validator = Validator::make($request->all(), [
            'payment_status' => 'required|in:pending,processing,paid,failed,refunded',
            'payment_metadata' => 'required|array'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $order->update([
            'payment_status' => $request->payment_status,
            'payment_metadata' => $request->payment_metadata
        ]);

        return response()->json($order);
    }

    public function updateDeliveryStatus(Order $order, Request $request)
    {
        $validator = Validator::make($request->all(), [
            'delivery_status' => 'required|in:pending,processing,shipped,delivered,failed',
            'message' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Add new message to delivery_messages
        $messages = $order->delivery_messages ?? [];
        $messages[] = [
            'status' => $request->delivery_status,
            'message' => $request->message,
            'timestamp' => now()->toISOString()
        ];

        $order->update([
            'delivery_status' => $request->delivery_status,
            'delivery_messages' => $messages
        ]);

        return response()->json($order);
    }

    public function createPayPalInvoice(Order $order)
    {
        try {
            if ($order->payment_status === 'paid') {
                return response()->json(['error' => 'Order is already paid'], 400);
            }

            if (empty($order->customer_email)) {
                return response()->json(['error' => 'Customer email is required'], 400);
            }

            $result = $this->paypalService->createInvoice(
                $order->total,
                $order->id,
                $order->customer_email
            );

            $order->update([
                'payment_status' => 'processing',
                'payment_provider' => 'paypal',
                'payment_id' => $result['id']
            ]);

            return response()->json($result);

        } catch (\Exception $e) {
            Log::error('Payment creation failed:', [
                'error' => $e->getMessage(),
                'order_id' => $order->id,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'error' => $e->getMessage()
            ], 400);
        }
    }

    public function pay(Order $order)
    {
        try {
            if ($order->payment_status === 'paid') {
                return response()->json(['error' => 'Order is already paid'], 400);
            }

            $result = $this->paypalService->createInvoice(
                $order->total,
                $order->id,
                $order->customer_email
            );

            $order->update([
                'payment_status' => 'processing',
                'payment_metadata' => [
                    'invoice_id' => $result['id'],
                    'payment_url' => $result['url']
                ]
            ]);

            return response()->json($result);

        } catch (\Exception $e) {
            Log::error('Payment creation failed:', [
                'order' => $order->id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function createPayment(Order $order)
    {
        try {
            if ($order->payment_status === 'paid') {
                return response()->json([
                    'error' => 'Order is already paid'
                ], 400);
            }

            $result = $this->paypalService->createInvoice(
                $order->total,
                $order->id,
                $order->customer_email
            );

            // Update order with payment info
            $order->update([
                'payment_status' => 'pending',
                'payment_id' => $result['id'],
                'payment_url' => $result['url']
            ]);

            return response()->json([
                'url' => $result['url']
            ]);

        } catch (\Exception $e) {
            Log::error('Payment creation failed:', [
                'order' => $order->id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'error' => 'Failed to create payment'
            ], 500);
        }
    }

    /**
     * Check payment status for an order
     */
    public function checkPaymentStatus($orderId)
    {
        try {
            $order = Order::findOrFail($orderId);
            $invoiceId = $order->payment_metadata['invoice_id'] ?? null;
            
            if (!$invoiceId) {
                return response()->json([
                    'status' => $order->payment_status,
                    'redirect' => $order->payment_status === 'paid' ? route('thank.you', ['orderId' => $order->id]) : null,
                    'paidAt' => $order->paid_at
                ]);
            }

            try {
                $paymentResult = $this->paypalService->checkInvoiceStatus($invoiceId);
                
                // Update order status if payment is completed
                if ($paymentResult['status'] === 'paid' && $order->payment_status !== 'paid') {
                    $order->update([
                        'payment_status' => 'paid',
                        'paid_at' => now(),
                        'payment_metadata' => array_merge(
                            $order->payment_metadata ?? [],
                            ['payment_info' => $paymentResult['payment_info']]
                        )
                    ]);
                }

                return response()->json([
                    'status' => $order->payment_status,
                    'redirect' => $order->payment_status === 'paid' ? route('thank.you', ['orderId' => $order->id]) : null,
                    'paidAt' => $order->paid_at,
                    'paymentDetails' => [
                        'status' => $paymentResult['status'],
                        'raw_status' => $paymentResult['raw_status'],
                        'invoice_id' => $paymentResult['invoice_id']
                    ]
                ]);

            } catch (\Exception $e) {
                Log::error('Payment status check failed:', [
                    'order_id' => $orderId,
                    'invoice_id' => $invoiceId,
                    'error' => $e->getMessage()
                ]);
                
                return response()->json([
                    'status' => $order->payment_status,
                    'redirect' => $order->payment_status === 'paid' ? route('thank.you', ['orderId' => $order->id]) : null,
                    'paidAt' => $order->paid_at,
                    'error' => 'Failed to check payment status'
                ]);
            }
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Order not found'
            ], 404);
        }
    }
}
