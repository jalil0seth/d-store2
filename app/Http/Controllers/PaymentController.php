<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Services\PayPalService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    protected $paypalService;

    public function __construct(PayPalService $paypalService)
    {
        $this->paypalService = $paypalService;
    }

    public function createInvoice(Request $request)
    {
        try {
            $order = Order::findOrFail($request->order_id);
            
            if ($order->invoice_id) {
                $status = $this->paypalService->checkStatus($order->invoice_id);
                if ($status['paid']) {
                    $order->markAsPaid();
                    return response()->json([
                        'status' => 'success',
                        'message' => 'Order already paid',
                        'data' => ['paid' => true]
                    ]);
                }
                
                return response()->json([
                    'status' => 'success',
                    'data' => [
                        'payment_url' => $order->payment_url,
                        'invoice_id' => $order->invoice_id,
                        'payment_status' => $order->payment_status
                    ]
                ]);
            }

            $order->markAsProcessing();
            $result = $this->paypalService->createInvoice($order);
            
            $order->update([
                'payment_method' => 'paypal',
                'invoice_id' => $result['invoice_id'],
                'payment_url' => $result['payment_url']
            ]);

            return response()->json([
                'status' => 'success',
                'data' => array_merge($result, [
                    'payment_status' => $order->payment_status
                ])
            ]);

        } catch (\Exception $e) {
            Log::error('Payment creation failed:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            $order?->markAsFailed();

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create payment'
            ], 500);
        }
    }

    public function checkStatus(Request $request)
    {
        try {
            $order = Order::where('invoice_id', $request->invoice_id)->firstOrFail();
            $status = $this->paypalService->checkStatus($order->invoice_id);

            if ($status['paid']) {
                $order->markAsPaid();
            } elseif ($status['status'] === 'CANCELLED') {
                $order->markAsCancelled();
            } elseif ($status['status'] === 'PAYMENT_FAILED') {
                $order->markAsFailed();
            }

            return response()->json([
                'status' => 'success',
                'data' => array_merge($status, [
                    'payment_status' => $order->payment_status
                ])
            ]);

        } catch (\Exception $e) {
            Log::error('Payment status check failed:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to check payment status'
            ], 500);
        }
    }

    public function cancel(Request $request)
    {
        try {
            $order = Order::findOrFail($request->order_id);
            $order->markAsCancelled();

            return response()->json([
                'status' => 'success',
                'message' => 'Payment cancelled',
                'data' => [
                    'payment_status' => $order->payment_status
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Payment cancellation failed:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to cancel payment'
            ], 500);
        }
    }
}
