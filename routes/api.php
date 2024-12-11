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
    Route::get('/{orderId}/payment-status', [OrderController::class, 'checkPaymentStatus']);
    Route::patch('/{order}/payment', [OrderController::class, 'updatePaymentStatus']);
    Route::patch('/{order}/delivery', [OrderController::class, 'updateDeliveryStatus']);
    Route::post('/{order}/pay', [OrderController::class, 'pay']);
});

// Protected Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::prefix('products')->group(function () {
        Route::post('/', [ProductController::class, 'store']);
        Route::post('/generate', [ProductController::class, 'generateProduct']);
        Route::post('/generate-page', [ProductController::class, 'generatePage']);
        Route::patch('/{id}', [ProductController::class, 'update']);
        Route::delete('/{id}', [ProductController::class, 'destroy']);
    });
});
