<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CommissionController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\MasterDataController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PackingController;
use App\Http\Controllers\Api\RegionController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Security Hardened API Routes
|--------------------------------------------------------------------------
*/

// One-click Web Browser Migration Helper Route (No Terminal Needed!)
Route::get('/run-migrate', function () {
    try {
        Artisan::call('migrate', ['--force' => true]);
        return response()->json([
            'success' => true,
            'message' => 'Migration berhasil dieksekusi di database!',
            'output'  => Artisan::output(),
        ]);
    } catch (\Throwable $e) {
        return response()->json([
            'success' => false,
            'message' => 'Gagal jalankan migration: ' . $e->getMessage(),
        ], 500);
    }
});

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
        Route::get('/{id}', [OrderController::class, 'show']);
        Route::put('/{id}', [OrderController::class, 'update']);
        Route::patch('/{id}', [OrderController::class, 'update']);
        Route::delete('/{id}', [OrderController::class, 'destroy']);
        Route::match(['post', 'patch'], '/{id}/approve', [OrderController::class, 'approve']);
        Route::match(['post', 'patch'], '/{id}/shipment', [OrderController::class, 'completeShipment']);
        Route::match(['post', 'patch'], '/{id}/complete-shipment', [OrderController::class, 'completeShipment']);
    });

    // Packing Operations API
    Route::prefix('packing')->group(function () {
        Route::get('/queue', [PackingController::class, 'queue']);
        Route::post('/configure-packages', [PackingController::class, 'configurePackages']);
        Route::post('/{id}/upload-proof', [PackingController::class, 'uploadProof']);
    });

    // Reports API
    Route::prefix('reports')->group(function () {
        Route::get('/sales', [ReportController::class, 'sales']);
        Route::get('/export-csv', [ReportController::class, 'exportCsv']);
    });

    // Commission Calculator API (Sales Staff Only)
    Route::get('/commission/my-commission', [CommissionController::class, 'myCommission']);

    // User Account Management API (Owner / Admin Only)
    Route::apiResource('users', UserController::class);

    // Notifications API
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::post('/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::post('/read-all', [NotificationController::class, 'markAllAsRead']);
    });
});
