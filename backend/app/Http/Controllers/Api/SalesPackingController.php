<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class SalesPackingController extends Controller
{
    public function progress(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Order::class);

        $orders = Order::with([
            'creator',
            'verifier',
            'items',
            'packages.items.item',
            'packages.packingImages.uploader',
        ])
            ->where('status', 'PACKING_COMPLETED')
            ->orderBy('created_at')
            ->paginate($request->integer('per_page', 50));

        return response()->json([
            'success' => true,
            'data' => OrderResource::collection($orders),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'total' => $orders->total(),
            ],
        ]);
    }
}
