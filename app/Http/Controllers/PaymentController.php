<?php

namespace App\Http\Controllers;

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
            Log::info('Creating invoice with data:', $request->all());
            
            $validated = $request->validate([
                'amount' => ['required', 'regex:/^\d+\.\d{2}$/'],
                'orderRef' => 'required|string',
                'email' => 'required|email'
            ]);

            $result = $this->paypalService->createInvoice(
                $validated['amount'],
                $validated['orderRef'],
                $validated['email']
            );

            return response()->json($result);

        } catch (\Exception $e) {
            Log::error('Payment creation failed:', [
                'error' => $e->getMessage(),
                'request_data' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);
            
            $errorMessage = $e->getMessage();
            if ($e instanceof \Illuminate\Validation\ValidationException) {
                $errorMessage = implode('. ', array_map(function($errors) {
                    return implode('. ', $errors);
                }, $e->validator->errors()->toArray()));
            }
            
            return response()->json([
                'error' => $errorMessage
            ], 400);
        }
    }

    public function checkStatus(Request $request, $order)
    {
        try {
            // Get the invoice ID from the order or request
            $invoiceId = $request->query('invoice_id');
            
            if (!$invoiceId) {
                return response()->json([
                    'error' => 'Invoice ID is required'
                ], 400);
            }

            $status = $this->paypalService->checkInvoiceStatus($invoiceId);
            return response()->json($status);

        } catch (\Exception $e) {
            Log::error('Payment status check failed:', [
                'error' => $e->getMessage(),
                'request_data' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'error' => $e->getMessage()
            ], 400);
        }
    }
}
