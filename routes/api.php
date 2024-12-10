<?php

use App\Http\Controllers\ProductController;
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
    Route::get('/{slug}-{id}', [ProductController::class, 'show']);
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
