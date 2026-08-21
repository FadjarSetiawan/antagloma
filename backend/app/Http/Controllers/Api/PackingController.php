<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UploadPackingImageRequest;
use App\Http\Resources\OrderResource;
use App\Http\Resources\PackingImageResource;
use App\Models\Order;
use App\Models\OrderPackage;
use App\Enums\OrderStatus;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\DB;
use App\Services\NotificationService;
use App\Services\PackingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Database\QueryException;

class PackingController extends Controller
{
    public function __construct(protected PackingService $packingService) {}

    public function queue(Request $request): JsonResponse
    {
        Gate::authorize('managePackingQueue', Order::class);

        // An order belongs in the packing queue if:
        // 1. Status is WAITING_PACKING, OR
        // 2. The order has unallocated items remaining (titip / belum diatur paket), regardless of whether existing packages have been photographed or shipped.
        $orders = Order::with(['creator', 'items', 'packingImages', 'packages.packingImages', 'packages.items.item'])
            ->whereNotIn('status', [OrderStatus::CANCELLED, OrderStatus::RETURNED])
            ->where(function ($query) {
                $query->where('status', OrderStatus::WAITING_PACKING)
                    ->orWhere(function ($q) {
                        // Order has unallocated items remaining across all packages
                        $q->whereRaw('(SELECT COALESCE(SUM(quantity), 0) FROM order_items WHERE order_items.order_id = orders.id) > (SELECT COALESCE(SUM(opi.quantity), 0) FROM order_packages op JOIN order_package_items opi ON opi.order_package_id = op.id WHERE op.order_id = orders.id)');
                    });
            })
            ->orderBy('created_at')
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

    public function configurePackages(Request $request): JsonResponse
    {
        $request->validate([
            'order_id'                  => 'required|integer|exists:orders,id',
            'packages'                  => 'required|array|min:1',
            'packages.*.letter'         => 'required|string|max:8',
            'packages.*.package_type'   => 'nullable|string',
            'packages.*.allocations'    => 'array',
        ]);

        $order = Order::with('items')->findOrFail($request->integer('order_id'));
        Gate::authorize('approve', $order);

        $deliveryMethod = $order->delivery_method instanceof \BackedEnum ? $order->delivery_method->value : (string) $order->delivery_method;
        abort_unless(in_array($deliveryMethod, ['Packing Kayu', 'Kirim Paket'], true), 422, 'Metode penerimaan ini tidak menggunakan paket.');

        $packages = DB::transaction(function () use ($request, $order) {
            $order = Order::with('items')->lockForUpdate()->findOrFail($order->id);
            $inputs = collect($request->input('packages'));
            $allocated = [];
            $invalidItems = [];

            foreach ($inputs as $input) {
                foreach (($input['allocations'] ?? []) as $itemIndex => $quantity) {
                    $item = $order->items->get((int) $itemIndex);
                    $quantity = filter_var($quantity, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
                    if (!$item || $quantity === false) {
                        $invalidItems[] = ['order_item_id' => $item?->id ?? $itemIndex, 'product_name' => $item?->product_name ?? 'Item tidak valid', 'required' => $item?->quantity ?? 0, 'allocated' => $quantity === false ? 0 : $quantity];
                        continue;
                    }
                    $allocated[$item->id] = ($allocated[$item->id] ?? 0) + $quantity;
                }
            }

            if ($invalidItems) {
                throw new HttpResponseException(response()->json([
                    'success' => false,
                    'message' => 'Alokasi item tidak valid.',
                    'errors'  => ['invalid_items' => $invalidItems],
                ], 422));
            }

            $letters = $inputs->pluck('letter')->all();
            $lockedPackages = $order->packages()->with('items')->whereNotNull('configured_at')->get()->keyBy('letter');

            // A submitted package is already in the document-print queue. Keep
            // its type and allocations immutable, while still allowing a new
            // package for plants that have not been allocated yet.
            foreach ($lockedPackages as $letter => $lockedPackage) {
                $input = $inputs->firstWhere('letter', $letter);
                abort_unless($input, 422, "Paket {$letter} sudah dikunci dan tidak dapat dihapus karena sudah masuk daftar cetak.");
                abort_unless(($input['package_type'] ?? null) === $lockedPackage->package_type, 422, "Paket {$letter} sudah dikunci dan jenis paketnya tidak dapat diubah.");

                $storedAllocations = $lockedPackage->items->mapWithKeys(fn ($allocation) => [$allocation->order_item_id => (int) $allocation->quantity])->all();
                $submittedAllocations = [];
                foreach (($input['allocations'] ?? []) as $itemIndex => $quantity) {
                    $item = $order->items->get((int) $itemIndex);
                    if ($item && (int) $quantity > 0) $submittedAllocations[$item->id] = (int) $quantity;
                }
                ksort($storedAllocations);
                ksort($submittedAllocations);
                abort_unless($storedAllocations === $submittedAllocations, 422, "Tanaman di Paket {$letter} sudah dikunci dan tidak dapat diubah.");
            }

            $order->packages()->whereNull('configured_at')->whereNotIn('letter', $letters)->delete();
            $used = [];
            foreach ($lockedPackages as $lockedPackage) {
                foreach ($lockedPackage->items as $allocation) {
                    $used[$allocation->order_item_id] = ($used[$allocation->order_item_id] ?? 0) + (int) $allocation->quantity;
                }
            }

            foreach ($inputs as $input) {
                $package = $lockedPackages->get($input['letter']);
                if ($package) {
                    continue;
                }
                $package = $order->packages()->updateOrCreate(['letter'=>$input['letter']], [
                    'package_type'     => $input['package_type'] ?? null,
                    'weight'           => isset($input['weight']) && is_numeric($input['weight']) ? (float) $input['weight'] : null,
                    'waiting_photo_at' => null,
                    'configured_at'    => now(),
                ]);
                $assignedItemIds = [];
                foreach (($input['allocations'] ?? []) as $itemIndex => $quantity) {
                    $item = $order->items->get((int) $itemIndex);
                    $quantity = (int) $quantity;
                    if (!$item || $quantity < 1 || (($used[$item->id] ?? 0) + $quantity) > $item->quantity) {
                        abort(422, "Quantity {$item?->product_name} melebihi jumlah tanaman dalam order.");
                    }
                    $used[$item->id] = ($used[$item->id] ?? 0) + $quantity;
                    $assignedItemIds[] = $item->id;
                    $package->items()->updateOrCreate(['order_item_id'=>$item->id], ['quantity'=>$quantity]);
                }
                $package->items()->whereNotIn('order_item_id', $assignedItemIds ?: [0])->delete();
            }

            return $order->packages()->with('packingImages')->get();
        });

        return response()->json(['success' => true, 'data' => $packages]);
    }

    /**
     * @deprecated Gunakan POST /api/print-jobs untuk integrasi print bridge resmi.
     */
    public function printDocument(Request $request, OrderPackage $package, string $document): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Endpoint ini sudah dideprecate. Gunakan alur POST /api/print-jobs untuk integrasi cetak resmi.',
        ], 410);
    }

    public function completePackageShipment(Request $request, OrderPackage $package): JsonResponse
    {
        Gate::authorize('completeShipment', $package->order);
        $data = $request->validate([
            'tracking_number' => 'required|string|max:255',
            'shipping_cost'   => 'required|numeric|min:0',
        ]);

        $trackingNumber = strtoupper(trim(strip_tags($data['tracking_number'])));
        $used = OrderPackage::with('order')
            ->whereRaw('UPPER(tracking_number) = ?', [$trackingNumber])
            ->whereKeyNot($package->id)
            ->first();

        if (!$used) {
            $usedOrder = Order::whereRaw('UPPER(tracking_number) = ?', [$trackingNumber])
                ->where('id', '!=', $package->order_id)
                ->first();
            if ($usedOrder) {
                return response()->json([
                    'message' => 'Nomor resi sudah digunakan.',
                    'duplicate' => [
                        'tracking_number' => $trackingNumber,
                        'order_number'    => $usedOrder->order_number,
                        'customer'        => $usedOrder->customer_name,
                    ],
                ], 422);
            }
        } else {
            return response()->json([
                'message' => 'Nomor resi sudah digunakan.',
                'duplicate' => [
                    'tracking_number' => $trackingNumber,
                    'order_number'    => $used->order?->order_number,
                    'customer'        => $used->order?->customer_name,
                ],
            ], 422);
        }

        $orderStatus = $package->order->status instanceof \BackedEnum ? $package->order->status->value : (string) $package->order->status;
        abort_unless(in_array($orderStatus, ['PACKING_COMPLETED', 'WAITING_PACKING'], true), 422, 'Package belum berada pada tahap siap input resi.');

        try {
            $package->update([
                'tracking_number' => $trackingNumber,
                'shipping_cost'   => $data['shipping_cost'],
                'completed_at'    => now(),
            ]);
        } catch (QueryException $exception) {
            if ((string) $exception->getCode() !== '23000') {
                throw $exception;
            }

            $used = OrderPackage::with('order')->whereRaw('UPPER(tracking_number) = ?', [$trackingNumber])->first();
            return response()->json([
                'message' => 'Nomor resi sudah digunakan.',
                'duplicate' => [
                    'tracking_number' => $trackingNumber,
                    'order_number'    => $used?->order?->order_number,
                    'customer'        => $used?->order?->customer_name,
                ]
            ], 422);
        }

        // Only mark order as fully COMPLETED if:
        // 1. ALL packages have tracking numbers, AND
        // 2. ALL items in the order have been allocated and shipped (no remaining titip plants)
        $completedOrder = DB::transaction(function () use ($package) {
            $order = Order::whereKey($package->order_id)->lockForUpdate()->firstOrFail();
            
            $hasPackagesWithoutTracking = $order->packages()
                ->where(fn ($query) => $query->whereNull('tracking_number')->orWhere('tracking_number', ''))
                ->exists();

            $totalRequiredQty = (int) $order->items()->sum('quantity');
            $totalAllocatedQty = (int) DB::table('order_packages')
                ->join('order_package_items', 'order_package_items.order_package_id', '=', 'order_packages.id')
                ->where('order_packages.order_id', $order->id)
                ->sum('order_package_items.quantity');
            $hasUnallocatedPlants = $totalAllocatedQty < $totalRequiredQty;

            if (!$hasPackagesWithoutTracking && !$hasUnallocatedPlants && $order->status !== OrderStatus::COMPLETED) {
                $order->update([
                    'status'       => OrderStatus::COMPLETED,
                    'shipped_at'   => $order->shipped_at ?? now(),
                    'completed_at' => now(),
                ]);
                NotificationService::notifyShipmentCompleted($order->fresh());
            } elseif ($hasUnallocatedPlants) {
                // Keep order in WAITING_PACKING so remaining titip items remain accessible in packing queue
                $order->update([
                    'status'     => OrderStatus::WAITING_PACKING,
                    'shipped_at' => $order->shipped_at ?? now(),
                ]);
            }

            return $order->fresh(['packages']);
        });

        return response()->json(['success' => true, 'data' => $package->fresh(), 'order' => $completedOrder]);
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

    public function uploadPackageProof(UploadPackingImageRequest $request, OrderPackage $package): JsonResponse
    {
        Gate::authorize('uploadPacking', $package->order);
        $image = $this->packingService->uploadPackageProof($package, $request->file('image'), $request->input('notes'), $request->user());
        return response()->json(['success' => true, 'data' => new PackingImageResource($image->load('uploader'))], 201);
    }
}
