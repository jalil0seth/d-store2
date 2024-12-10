<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// Public Routes
Route::get('/', function () {
    return Inertia::render('HomePage');
})->name('home');

Route::get('/products', function () {
    return Inertia::render('ProductsPage');
})->name('products');

Route::get('/product/{slug}-{id}', function ($slug, $id) {
    return Inertia::render('product/index', [
        'productId' => $id,
        'productSlug' => $slug
    ]);
})->name('product.show');

Route::get('/signin', function () {
    return Inertia::render('SignInPage');
})->name('signin');

// Admin Routes
Route::prefix('admin')->group(function () {
    Route::get('/', function () {
        return Inertia::render('admin/Dashboard');
    })->name('admin.dashboard');

    Route::get('/products', function () {
        return Inertia::render('admin/products/index');
    })->name('admin.products');

    Route::get('/users', function () {
        return Inertia::render('admin/users/index');
    })->name('admin.users');

    Route::get('/orders', function () {
        return Inertia::render('admin/orders/index');
    })->name('admin.orders');


    Route::get('/pages', function () {
        return Inertia::render('admin/PagesPage');
    })->name('admin.pages');


    Route::get('/config', function () {
        return Inertia::render('admin/StoreConfigPage');
    })->name('admin.store-config');
});


Route::get('/test', function () {
    return response()->json(['message' => 'API is working']);
});