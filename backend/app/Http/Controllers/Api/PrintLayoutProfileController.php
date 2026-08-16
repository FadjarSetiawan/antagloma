<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PrintLayoutProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PrintLayoutProfileController extends Controller
{
    private const TYPES = ['NOTA', 'SHIPPING_LABEL'];

    public function show(string $documentType): JsonResponse
    {
        abort_unless(in_array($documentType, self::TYPES, true), 404);
        return response()->json(['document_type' => $documentType, 'layout' => PrintLayoutProfile::where('document_type', $documentType)->value('layout') ?? []]);
    }

    public function update(Request $request, string $documentType): JsonResponse
    {
        abort_unless(in_array($documentType, self::TYPES, true), 404);
        $data = $request->validate([
            'layout' => ['required', 'array'],
            'layout.*.x' => ['nullable', 'integer', 'between:-120,120'],
            'layout.*.y' => ['nullable', 'integer', 'between:-120,120'],
            'layout.*.scale' => ['nullable', 'numeric', 'between:0.75,1.35'],
        ]);
        $profile = PrintLayoutProfile::updateOrCreate(['document_type' => $documentType], ['layout' => $data['layout']]);
        return response()->json(['success' => true, 'document_type' => $profile->document_type, 'layout' => $profile->layout]);
    }
}
