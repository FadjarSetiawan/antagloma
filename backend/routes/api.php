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
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Security Hardened API Routes
|--------------------------------------------------------------------------
*/

// Public Authentication (Rate limited to 5 attempts per minute to prevent Brute Force & DoS)
Route::middleware('throttle:5,1')->post('/login', [AuthController::class, 'login']);

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
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);

    // Sales Commission Route
    Route::get('/sales/commission', [CommissionController::class, 'index']);

    // Master Products CRUD (Owner & Admin)
    Route::post('/master/trees', [MasterDataController::class, 'storeTree']);
    Route::put('/master/trees/{id}', [MasterDataController::class, 'updateTree']);
    Route::delete('/master/trees/{id}', [MasterDataController::class, 'destroyTree']);
    Route::put('/master/grades/{id}', [MasterDataController::class, 'updateGrade']);

    // Orders CRUD & Policy Authorization Actions
    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::put('/orders/{id}', [OrderController::class, 'update']);
    Route::delete('/orders/{id}', [OrderController::class, 'destroy']);
    Route::post('/orders/{id}/approve', [OrderController::class, 'approve']);
    Route::post('/orders/{id}/complete-shipment', [OrderController::class, 'completeShipment']);

    // Packing Workflow
    Route::get('/packing/queue', [PackingController::class, 'queue']);
    Route::post('/orders/{id}/packing-proof', [PackingController::class, 'uploadProof']);

    // Reports
    Route::get('/reports/summary', [ReportController::class, 'summary']);
});
