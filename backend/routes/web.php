<?php

use Illuminate\Support\Facades\Route;

Route::get('/{any}', function () {
    $indexPath = public_path('index.html');
    if (file_exists($indexPath)) {
        return response()->file($indexPath);
    }
    return response()->json(['message' => 'Antagloma Florist API System']);
})->where('any', '.*');
