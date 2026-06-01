<?php

use App\Http\Controllers\PaymentController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('/orders', [PaymentController::class, 'createOrder'])->name('orders.create');
});
