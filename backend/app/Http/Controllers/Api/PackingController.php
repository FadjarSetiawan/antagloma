<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UploadPackingImageRequest;
use App\Http\Resources\OrderResource;
use App\Http\Resources\PackingImageResource;
use App\Models\Order;
use App\Models\OrderPackage;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\DB;
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
        $orders = Order::with(['creator', 'items', 'packingImages', 'packages.packingImages', 'packages.items.item'])
            ->where('status', 'WAITING_PACKING')
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
        $request->validate(['order_id'=>'required|integer|exists:orders,id','packages'=>'required|array|min:1','packages.*.letter'=>'required|string|max:8','packages.*.package_type'=>'nullable|string','packages.*.allocations'=>'array']);
        $order = Order::with('items')->findOrFail($request->integer('order_id'));
        Gate::authorize('approve', $order);
        $deliveryMethod = $order->delivery_method instanceof \BackedEnum ? $order->delivery_method->value : (string) $order->delivery_method;
        abort_unless(in_array($deliveryMethod, ['Packing Kayu', 'Kirim Paket'], true), 422, 'Metode penerimaan ini tidak menggunakan paket.');
        $packages = DB::transaction(function () use ($request, $order) {
            $used = [];
            foreach ($request->input('packages') as $input) {
                $package = $order->packages()->updateOrCreate(['letter'=>$input['letter']], ['package_type'=>$input['package_type'] ?? null, 'waiting_photo_at'=>null]);
                foreach (($input['allocations'] ?? []) as $itemIndex => $quantity) {
                    $item = $order->items->get((int) $itemIndex); $quantity = (int) $quantity;
                    if (!$item || $quantity < 1 || (($used[$item->id] ?? 0) + $quantity) > $item->quantity) abort(422, 'Alokasi paket melebihi quantity order.');
                    $used[$item->id] = ($used[$item->id] ?? 0) + $quantity;
                    $package->items()->updateOrCreate(['order_item_id'=>$item->id], ['quantity'=>$quantity]);
                }
            }
            $order->update(['status'=>'WAITING_PACKING']);
            return $order->packages()->with('packingImages')->get();
        });
        return response()->json(['success'=>true,'data'=>$packages]);
    }

    public function printDocument(Request $request, OrderPackage $package, string $document): JsonResponse
    {
        Gate::authorize('approve', $package->order);
        abort_unless(in_array($document, ['nota','label']), 422, 'Dokumen tidak valid.');
        $field = $document.'_printed'; $at = $field.'_at';
        $package->update([$field=>true, $at=>now(), 'waiting_photo_at'=>($package->nota_printed && $package->label_printed && !$package->waiting_photo_at) ? now() : $package->waiting_photo_at]);
        return response()->json(['success'=>true,'data'=>$package->fresh('packingImages')]);
    }

    public function completePackageShipment(Request $request, OrderPackage $package): JsonResponse
    {
        Gate::authorize('completeShipment', $package->order);
        $data = $request->validate(['tracking_number'=>'required|string|max:255','shipping_cost'=>'required|numeric|min:0']);
        $package->update(['tracking_number'=>strip_tags($data['tracking_number']), 'shipping_cost'=>$data['shipping_cost'], 'completed_at'=>now()]);
        return response()->json(['success'=>true,'data'=>$package->fresh()]);
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
        return response()->json(['success'=>true,'data'=>new PackingImageResource($image->load('uploader'))], 201);
    }
}
