<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Services\PayPalService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class OrderController extends Controller
{
    protected $paypalService;

    public function __construct(PayPalService $paypalService)
    {
        $this->paypalService = $paypalService;
    }

    public function index(Request $request)
    {
        $deviceHash = $request->cookie('device_hash');
        
        $orders = Order::where('customer_device_hash', $deviceHash)
            ->orderBy('created_at', 'desc')
            ->paginate(10);
            
        return response()->json($orders);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'items' => 'required|array',
            'items.*.id' => 'required|string',
            'items.*.name' => 'required|string',
            'items.*.price' => 'required|numeric',
            'items.*.quantity' => 'required|integer|min:1',
            'total' => 'required|numeric|min:0',
            'email' => 'nullable|email',
            'customer_info' => 'nullable|array',
            'customer_info.name' => 'nullable|string',
            'customer_info.whatsapp' => 'nullable|string',
            'discount' => 'nullable|numeric|min:0'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Get or create device hash
        $deviceHash = $request->cookie('device_hash');
        if (!$deviceHash) {
            $deviceHash = hash('sha256', uniqid('', true));
            Cookie::queue('device_hash', $deviceHash, 60 * 24 * 365 * 10); // 10 years
        }

        $order = Order::create([
            'customer_device_hash' => $deviceHash,
            'email' => $request->email,
            'customer_info' => $request->customer_info,
            'items' => $request->items,
            'total' => $request->total,
            'discount' => $request->discount ?? 0,
            'payment_status' => 'pending',
            'delivery_status' => 'pending'
        ]);

        return response()->json($order, 201);
    }

    public function show(Order $order, Request $request)
    {
        // Verify the order belongs to the current device
        if ($order->customer_device_hash !== $request->cookie('device_hash')) {
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

    public function pay(Order $order)
    {
        try {
            if ($order->payment_status === 'paid') {
                return response()->json(['error' => 'Order is already paid'], 400);
            }

            $result = $this->paypalService->createInvoice(
                $order->total - $order->discount,
                $order->id,
                $order->email
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
                $order->orderRef,
                $order->email
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

    public function checkPaymentStatus(Order $order)
    {
        try {
            if (!$order->payment_id) {
                return response()->json([
                    'error' => 'No payment found for this order'
                ], 400);
            }

            $result = $this->paypalService->checkInvoiceStatus($order->payment_id);

            if ($result['status'] === 'paid' && $order->payment_status !== 'paid') {
                $order->update([
                    'payment_status' => 'paid',
                    'paid_at' => now()
                ]);
            }

            return response()->json([
                'status' => $result['status']
            ]);

        } catch (\Exception $e) {
            Log::error('Payment status check failed:', [
                'order' => $order->id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'error' => 'Failed to check payment status'
            ], 500);
        }
    }
}
