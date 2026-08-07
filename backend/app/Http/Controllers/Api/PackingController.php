<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UploadPackingImageRequest;
use App\Http\Resources\OrderResource;
use App\Http\Resources\PackingImageResource;
use App\Models\Order;
use App\Services\NotificationService;
use App\Services\PackingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PackingController extends Controller
{
    public function __construct(protected PackingService $packingService) {}

    public function queue(Request $request): JsonResponse
    {
        $orders = Order::with(['creator', 'items', 'packingImages'])
            ->whereIn('status', ['WAITING_PROCESS', 'WAITING_PACKING', 'PACKING_COMPLETED'])
            ->latest()
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data'    => OrderResource::collection($orders),
            'meta'    => [
                'current_page' => $orders->currentPage(),
                'last_page'    => $orders->lastPage(),
                'total'        => $orders->total(),
            ]
        ]);
    }

    public function uploadProof(UploadPackingImageRequest $request, int $id): JsonResponse
    {
        $order = Order::findOrFail($id);

        $packingImage = $this->packingService->uploadPackingProof(
            $order,
            $request->file('image'),
            $request->input('notes'),
            $request->user()
        );

        // Trigger Notification to Admin & Owner
        NotificationService::notifyPackingCompleted($order->fresh(), $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Foto packing berhasil diunggah dan status order otomatis diperbarui.',
            'data'    => new PackingImageResource($packingImage->load('uploader')),
        ], 201);
    }
}
