<?php

namespace App\Services;

use App\Models\Payment;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PayPalService
{
    protected $mode;
    protected $clientId;
    protected $secret;
    protected $baseUrl;
    protected $accessToken;
    protected $currency = 'USD';
    protected $shopName;
    protected $shopNotes;
    protected $shopTerms;

    public function __construct()
    {
        $paypal = Payment::where('active', true)
            ->where('name', 'paypal')
            ->first();

        if (!$paypal) {
            Log::error('No active PayPal configuration found');
            throw new \Exception('PayPal configuration not found');
        }

        $config = $paypal->config;
        
        $this->mode = $config['mode'] ?? 'sandbox';
        $this->clientId = $config['client_id'] ?? null;
        $this->secret = $config['client_secret'] ?? null;
        $this->baseUrl = $this->mode === 'sandbox' 
            ? 'https://api-m.sandbox.paypal.com' 
            : 'https://api-m.paypal.com';
        
        $this->shopName = config('app.name', 'Store Name');
        $this->shopNotes = $config['notes'] ?? '';
        $this->shopTerms = $config['terms'] ?? '';

        if (!$this->clientId || !$this->secret) {
            Log::error('PayPal credentials missing:', [
                'hasClientId' => !empty($this->clientId),
                'hasSecret' => !empty($this->secret)
            ]);
            throw new \Exception('PayPal credentials are not configured');
        }
        
        $this->getAccessToken();
    }

    protected function getAccessToken()
    {
        try {
            Log::info('Requesting PayPal access token...');

            $response = Http::withBasicAuth($this->clientId, $this->secret)
                ->asForm()
                ->post("{$this->baseUrl}/v1/oauth2/token", [
                    'grant_type' => 'client_credentials'
                ]);

            if (!$response->successful()) {
                Log::error('PayPal token error:', [
                    'status' => $response->status(),
                    'statusText' => $response->reason(),
                    'error' => $response->body()
                ]);
                throw new \Exception("Failed to get access token: {$response->status()} {$response->reason()}");
            }

            $data = $response->json();
            Log::info('Successfully obtained PayPal access token');
            $this->accessToken = $data['access_token'];
        } catch (\Exception $e) {
            Log::error('PayPal auth error:', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    public function createInvoice($amount, $orderRef, $email)
    {
        try {
            Log::info('Creating PayPal invoice...', [
                'amount' => $amount,
                'orderRef' => $orderRef,
                'email' => $email
            ]);

            // Split shop name for given_name and surname
            $nameParts = explode(' ', $this->shopName);
            $firstName = $nameParts[0];
            $lastName = isset($nameParts[1]) ? $nameParts[1] : '';

            $invoiceData = [
                'detail' => [
                    'invoice_number' => 'INV-' . time(),
                    'currency_code' => $this->currency,
                    'note' => $this->shopNotes,
                    'terms_and_conditions' => $this->shopTerms,
                    'payment_term' => [
                        'term_type' => 'DUE_ON_RECEIPT'
                    ]
                ],
                'invoicer' => [
                    'name' => [
                        'given_name' => $firstName,
                        'surname' => $lastName,
                    ],
                    'address' => [
                        'country_code' => 'US'
                    ]
                ],
                'primary_recipients' => [[
                    'billing_info' => [
                        'name' => [
                            'given_name' => 'Valued',
                            'surname' => 'Customer'
                        ],
                        'email_address' => $email,
                        'address' => [
                            'country_code' => 'US'
                        ]
                    ]
                ]],
                'items' => [[
                    'name' => "Order {$orderRef}",
                    'description' => 'Support & Service provided',
                    'quantity' => '1',
                    'unit_amount' => [
                        'currency_code' => $this->currency,
                        'value' => number_format((float)$amount, 2, '.', '')
                    ]
                ]],
                'amount' => [
                    'breakdown' => [
                        'item_total' => [
                            'currency_code' => $this->currency,
                            'value' => number_format((float)$amount, 2, '.', '')
                        ]
                    ]
                ],
                'configuration' => [
                    'tax_calculated_after_discount' => false,
                    'tax_inclusive' => false,
                    'allow_tip' => false
                ]
            ];

            Log::debug('PayPal invoice data:', $invoiceData);

            $response = Http::withToken($this->accessToken)
                ->post("{$this->baseUrl}/v2/invoicing/invoices", $invoiceData);

            if (!$response->successful()) {
                Log::error('PayPal invoice creation error:', [
                    'status' => $response->status(),
                    'body' => $response->json(),
                    'request_data' => $invoiceData
                ]);
                throw new \Exception("Failed to create invoice: {$response->status()} {$response->reason()}");
            }

            $invoiceData = $response->json();
            Log::info('Invoice created:', $invoiceData);
            
            $parts = explode('/', $invoiceData['href']);
            $invoiceId = end($parts);

            // Send the invoice
            Log::info('Sending PayPal invoice...');
            $sendData = [
                'send_to_recipient' => true,
                'send_to_invoicer' => true
            ];

            $sendResponse = Http::withToken($this->accessToken)
                ->post("{$this->baseUrl}/v2/invoicing/invoices/{$invoiceId}/send", $sendData);

            if (!$sendResponse->successful()) {
                Log::error('PayPal send invoice error:', [
                    'status' => $sendResponse->status(),
                    'body' => $sendResponse->json(),
                    'invoiceId' => $invoiceId
                ]);
                throw new \Exception("Failed to send invoice: {$sendResponse->status()} {$sendResponse->reason()}");
            }

            $sendData = $sendResponse->json();
            Log::info('Invoice sent successfully:', $sendData);

            $paymentUrl = "https://www.{$this->mode}.paypal.com/invoice/p/#{$invoiceId}";
            
            Log::info('Invoice created and sent successfully', [
                'invoiceId' => $invoiceId,
                'paymentUrl' => $paymentUrl
            ]);

            return [
                'url' => $paymentUrl,
                'id' => $invoiceId,
                'total' => $amount
            ];

        } catch (\Exception $e) {
            Log::error('Error creating invoice:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    public function checkInvoiceStatus($invoiceId)
    {
        try {
            if (!$invoiceId) {
                throw new \Exception("Invoice ID is required");
            }

            $response = Http::withToken($this->accessToken)
                ->get("{$this->baseUrl}/v2/invoicing/invoices/{$invoiceId}");

            if (!$response->successful()) {
                Log::error('PayPal get invoice status error:', [
                    'status' => $response->status(),
                    'body' => $response->json(),
                    'invoiceId' => $invoiceId
                ]);
                throw new \Exception("Failed to get invoice status: {$response->status()} {$response->reason()}");
            }

            $data = $response->json();
            Log::info('Got invoice status:', ['data' => $data]);

            // Map PayPal status to our status
            $status = match($data['status']) {
                'PAID' => 'paid',
                'MARKED_AS_PAID' => 'paid',
                'CANCELLED' => 'cancelled',
                'REFUNDED' => 'refunded',
                'PARTIALLY_REFUNDED' => 'partially_refunded',
                'MARKED_AS_REFUNDED' => 'refunded',
                'UNPAID' => 'pending',
                'DRAFT' => 'pending',
                'SCHEDULED' => 'pending',
                'SENT' => 'pending',
                default => 'pending'
            };

            return [
                'status' => $status,
                'invoice_id' => $invoiceId,
                'raw_status' => $data['status'],
                'payment_info' => $data['payments'] ?? null
            ];

        } catch (\Exception $e) {
            Log::error('Error checking invoice status:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'invoiceId' => $invoiceId
            ]);
            throw $e;
        }
    }
}
