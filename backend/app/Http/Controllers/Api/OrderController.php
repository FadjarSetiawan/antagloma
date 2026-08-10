<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateOrderRequest;
use App\Http\Requests\UpdateOrderRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class OrderController extends Controller
{
    public function __construct(
        protected OrderService $orderService
    ) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Order::class);

        $query = Order::with(['creator', 'verifier', 'items', 'packingImages', 'packages.packingImages', 'packages.items.item']);

        $user = $request->user();
        $role = $user?->role instanceof \BackedEnum ? $user->role->value : (string) ($user?->role ?? '');
        if ($role === 'sales') {
            $query->where('created_by', $user->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('order_date')) {
            $query->whereDate('order_date', $request->order_date);
        }

        if ($request->filled('search')) {
            $search = strip_tags($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                  ->orWhere('customer_name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $orders = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 15));

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

    public function store(CreateOrderRequest $request): JsonResponse
    {
        Gate::authorize('create', Order::class);

        $validated = $request->validated();

        if (is_string($request->input('items'))) {
            $validated['items'] = json_decode($request->input('items'), true);
        }
        if ($request->hasFile('payment_proof')) {
            $validated['payment_proof'] = $request->file('payment_proof');
        }

        $order = $this->orderService->createOrder($validated, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Pesanan berhasil dibuat.',
            'data'    => new OrderResource($order),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $order = Order::with(['creator', 'verifier', 'items', 'packingImages', 'packages.packingImages', 'packages.items.item'])->findOrFail($id);
        Gate::authorize('view', $order);

        return response()->json([
            'success' => true,
            'data'    => new OrderResource($order),
        ]);
    }

    public function update(UpdateOrderRequest $request, int $id): JsonResponse
    {
        $order = Order::findOrFail($id);
        Gate::authorize('update', $order);

        $updated = $this->orderService->updateOrder($order, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Pesanan berhasil diperbarui.',
            'data'    => new OrderResource($updated),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $order = Order::findOrFail($id);
        Gate::authorize('delete', $order);

        $this->orderService->deleteOrder($order);

        return response()->json([
            'success' => true,
            'message' => 'Pesanan berhasil dihapus.',
        ]);
    }

    public function approve(Request $request, int $id): JsonResponse
    {
        $order = Order::findOrFail($id);
        Gate::authorize('approve', $order);

        $approved = $this->orderService->approveOrder($order, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Pesanan berhasil disetujui dan diteruskan ke antrean packing.',
            'data'    => new OrderResource($approved),
        ]);
    }

    public function completeShipment(Request $request, int $id): JsonResponse
    {
        $order = Order::findOrFail($id);
        Gate::authorize('completeShipment', $order);

        $request->validate([
            'shipping_cost'   => ['nullable', 'numeric', 'min:0'],
            'tracking_number' => ['nullable', 'string', 'max:255'],
        ]);

        $completed = $this->orderService->completeShipment($order, $request->all());

        return response()->json([
            'success' => true,
            'message' => 'Pengiriman berhasil dikonfirmasi dan order selesai.',
            'data'    => new OrderResource($completed),
        ]);
    }

    public function markSalesInformed(Request $request, int $id): JsonResponse
    {
        $order = Order::with(['packages.packingImages'])->findOrFail($id);
        Gate::authorize('salesInform', $order);
        abort_unless(in_array($order->status->value, ['PACKING_COMPLETED', 'COMPLETED'], true), 422, 'Pesanan belum selesai diproses.');
        $packages = $order->packages;
        abort_if($packages->isEmpty() || $packages->contains(fn ($package) => blank($package->tracking_number)), 422, 'Semua package harus memiliki nomor resi terlebih dahulu.');
        abort_if($packages->contains(fn ($package) => $package->packingImages->isEmpty()), 422, 'Semua package harus memiliki minimal satu foto packing terlebih dahulu.');
        $order->update(['sales_informed_at' => now()]);
        return response()->json(['success' => true, 'message' => 'Pesanan berhasil ditandai sudah diinformasikan.', 'data' => new OrderResource($order->fresh())]);
    }
}
