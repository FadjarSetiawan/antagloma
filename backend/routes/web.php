<?php

use Illuminate\Support\Facades\Route;

Route::get('/storage/{path}', function (string $path) {
    $cleanPath = str_replace(['../', '..\\'], '', $path);
    $filePath = storage_path('app/public/' . $cleanPath);

    if (!file_exists($filePath) || !is_file($filePath)) {
        abort(404, 'Gambar tidak ditemukan.');
    }

    return response()->file($filePath, [
        'Cache-Control' => 'public, max-age=86400',
        'Access-Control-Allow-Origin' => '*',
    ]);
})->where('path', '.*');

Route::get('/{any}', function () {
    $indexPath = public_path('index.html');
    if (file_exists($indexPath)) {
        return response()->file($indexPath);
    }
    return response()->json(['message' => 'Antagloma Florist API System']);
})->where('any', '.*');
