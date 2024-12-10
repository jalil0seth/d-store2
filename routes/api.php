<?php

use App\Http\Controllers\ProductController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PaymentController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Test route to verify API is working
Route::get('/test', function () {
    return response()->json(['message' => 'API is working']);
});

// Product Routes - No Authentication Required
Route::prefix('products')->group(function () {
    Route::get('/', [ProductController::class, 'index']);
    Route::get('/import', [ProductController::class, 'importFromApi']);
    Route::get('/{id}', [ProductController::class, 'show'])->where('id', '[0-9]+');
});

// Order Routes
Route::prefix('orders')->group(function () {
    Route::get('/', [OrderController::class, 'index']);
    Route::post('/', [OrderController::class, 'store']);
    Route::get('/{order}', [OrderController::class, 'show']);
    Route::patch('/{order}/payment', [OrderController::class, 'updatePaymentStatus']);
    Route::patch('/{order}/delivery', [OrderController::class, 'updateDeliveryStatus']);
    
    // Payment routes
    Route::post('/{order}/pay', [PaymentController::class, 'createInvoice']);
    Route::get('/{order}/payment-status', [PaymentController::class, 'checkStatus']);
    Route::get('/{order}/status', [OrderController::class, 'checkPaymentStatus']);
});

Route::middleware('api')->group(function () {
    // Order routes
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{deviceHash}', [OrderController::class, 'index']);
    
    // Payment routes
    Route::post('/orders/{order}/payment', [OrderController::class, 'createPayment']);
    Route::get('/orders/{order}/payment/status', [OrderController::class, 'checkPaymentStatus']);
});

// Protected Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::prefix('products')->group(function () {
        Route::post('/', [ProductController::class, 'store']);
        Route::post('/generate', [ProductController::class, 'generateProduct']);
        Route::post('/generate-page', [ProductController::class, 'generatePage']);
        Route::put('/{product}', [ProductController::class, 'update']);
        Route::delete('/{product}', [ProductController::class, 'destroy']);
    });

    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});
