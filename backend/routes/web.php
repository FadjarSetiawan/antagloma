<?php

use Illuminate\Support\Facades\Route;

Route::get('/storage/{path}', function (string $path) {
    $cleanPath = str_replace(['../', '..\\'], '', $path);
    
    $locations = [
        storage_path('app/public/' . $cleanPath),
        storage_path('app/' . $cleanPath),
        public_path('storage/' . $cleanPath),
        base_path('storage/app/public/' . $cleanPath),
    ];

    foreach ($locations as $filePath) {
        if (file_exists($filePath) && is_file($filePath)) {
            $mimeType = function_exists('mime_content_type') ? (mime_content_type($filePath) ?: 'image/jpeg') : 'image/jpeg';
            return response()->file($filePath, [
                'Content-Type'               => $mimeType,
                'Cache-Control'              => 'public, max-age=86400',
                'Access-Control-Allow-Origin' => '*',
            ]);
        }
    }

    abort(404, 'Gambar tidak ditemukan.');
})->where('path', '.*');

Route::get('/{any}', function () {
    $indexPath = public_path('index.html');
    if (file_exists($indexPath)) {
        return response()->file($indexPath);
    }
    return response()->json(['message' => 'Antagloma Florist API System']);
})->where('any', '.*');
