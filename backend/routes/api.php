<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CommissionController;
use App\Http\Controllers\Api\DiscountController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\MasterDataController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PackingController;
use App\Http\Controllers\Api\PrintJobController;
use App\Http\Controllers\Api\RegionController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SalesPackingController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Security Hardened API Routes
|--------------------------------------------------------------------------
*/

// Public Authentication (Rate limited to 5 attempts per minute to prevent Brute Force & DoS)
Route::middleware('throttle:5,1')->post('/login', [AuthController::class, 'login']);
Route::middleware('throttle:5,1')->post('/register', [AuthController::class, 'register']);

// Indonesian Administrative Region Cascading Data (Cached / Throttled)
Route::middleware('throttle:60,1')->prefix('regions')->group(function () {
    Route::get('/provinces', [RegionController::class, 'provinces']);
    Route::get('/regencies/{provinceId}', [RegionController::class, 'regencies']);
    Route::get('/districts/{regencyId}', [RegionController::class, 'districts']);
});

// Master Data Public Reading Routes (Throttled)
Route::middleware('throttle:60,1')->prefix('master')->group(function () {
    Route::get('/trees', [MasterDataController::class, 'trees']);
    Route::get('/grades', [MasterDataController::class, 'grades']);
});

// Protected Routes (Sanctum Authenticated + Throttled)
Route::middleware(['auth:sanctum', 'throttle:120,1'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Dashboard
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);

    // Orders Management Resource API
    Route::prefix('orders')->group(function () {
        Route::get('/', [OrderController::class, 'index']);
        Route::post('/', [OrderController::class, 'store']);
        Route::get('/next-number', [OrderController::class, 'nextNumber']);
        Route::get('/{id}', [OrderController::class, 'show']);
        Route::put('/{id}', [OrderController::class, 'update']);
        Route::patch('/{id}', [OrderController::class, 'update']);
        Route::delete('/{id}', [OrderController::class, 'destroy']);
        Route::match(['post', 'patch'], '/{id}/approve', [OrderController::class, 'approve']);
        Route::match(['post', 'patch'], '/{id}/reject', [OrderController::class, 'reject']);
        Route::match(['post', 'patch'], '/{id}/shipment', [OrderController::class, 'completeShipment']);
        Route::match(['post', 'patch'], '/{id}/complete-shipment', [OrderController::class, 'completeShipment']);
        Route::post('/{id}/sales-informed', [OrderController::class, 'markSalesInformed']);
    });

    // Packing Operations API
    Route::prefix('packing')->group(function () {
        Route::get('/queue', [PackingController::class, 'queue']);
        Route::post('/configure-packages', [PackingController::class, 'configurePackages']);
        Route::post('/{id}/upload-proof', [PackingController::class, 'uploadProof']);
        Route::post('/packages/{package}/upload-proof', [PackingController::class, 'uploadPackageProof']);
        Route::post('/packages/{package}/print/{document}', [PackingController::class, 'printDocument']);
        Route::post('/packages/{package}/shipment', [PackingController::class, 'completePackageShipment']);
    });

    // Web creates a short-lived, one-time job; no customer data is placed in the App Link.
    Route::post('/print-jobs', [PrintJobController::class, 'create']);

    // Read-only package progress for Sales (Admin/Owner are also allowed by OrderPolicy::viewAny).
    Route::get('/sales/packing-progress', [SalesPackingController::class, 'progress']);

    // Reports API
    Route::prefix('reports')->group(function () {
        Route::get('/sales', [ReportController::class, 'sales']);
        Route::get('/export-csv', [ReportController::class, 'exportCsv']);
    });

    // Commission Calculator API (Sales Staff & Owner)
    Route::get('/commission/my-commission', [CommissionController::class, 'index']);
    Route::get('/sales/commission', [CommissionController::class, 'index']);
    Route::get('/commissions', [CommissionController::class, 'index']);
    Route::get('/commissions/payouts', [CommissionController::class, 'getPayouts']);
    Route::get('/commissions/preview-orders', [CommissionController::class, 'previewOrders']); // must be before /{salesId}
    Route::post('/commissions/payouts', [CommissionController::class, 'recordPayout']);
    Route::get('/commissions/{salesId}', [CommissionController::class, 'show']);
    Route::put('/commissions/{salesId}', [CommissionController::class, 'update']);
    Route::apiResource('discounts', DiscountController::class)->only(['index', 'store', 'update', 'destroy']);

    // User Account Management API (Owner / Admin Only)
    Route::apiResource('users', UserController::class);

    // Notifications API
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::post('/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::post('/read-all', [NotificationController::class, 'markAllAsRead']);
        Route::delete('/{id}', [NotificationController::class, 'destroy']);
    });
});

// The bridge authenticates these endpoints with the job's one-time bearer token, not a user session.
Route::middleware('throttle:30,1')->group(function () {
    Route::get('/print-jobs/{jobId}', [PrintJobController::class, 'show']);
    Route::post('/print-jobs/{jobId}/result', [PrintJobController::class, 'result']);
});
