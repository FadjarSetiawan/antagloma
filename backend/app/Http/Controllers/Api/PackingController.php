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
        // Antrean Packing Tanaman (Belum Diatur Pengiriman) ONLY shows orders with WAITING_PACKING status
        // Once packages are configured, order status becomes PACKING_COMPLETED and moves to "Menunggu Cetak Dokumen"
        $orders = Order::with(['creator', 'items', 'packingImages'])
            ->where('status', 'WAITING_PACKING')
            ->latest()
            ->paginate(50);

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
