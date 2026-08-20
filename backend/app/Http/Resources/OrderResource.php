<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $statusStr = $this->status instanceof \BackedEnum ? $this->status->value : (string) $this->status;
        $deliveryStr = $this->delivery_method instanceof \BackedEnum ? $this->delivery_method->value : (string) $this->delivery_method;
        $role = $request->user()?->role instanceof \BackedEnum ? $request->user()->role->value : (string) ($request->user()?->role ?? '');
        $isSales = $role === 'sales';

        $grossPlantTotal = $this->items ? $this->items->sum(fn ($item) => (float) $item->price) : 0;
        $returnedAmount = $this->packages ? $this->packages->sum(fn ($package) => (float) ($package->return_amount ?? 0)) : 0;
        $plantTotal = max(0, $grossPlantTotal - $returnedAmount);

        $isVerified = !in_array($statusStr, ['WAITING_PROCESS', 'CANCELLED', 'RETURNED']);
        $commissionRate = (float) ($this->creator?->commission_rate ?? 5);
        $salesCommission = $isVerified ? round($plantTotal * $commissionRate / 100) : 0;

        return [
            'id'                  => $this->id,
            'order_number'        => $this->order_number,
            'order_date'          => $this->order_date?->format('Y-m-d'),
            'customer_name'       => $this->customer_name,
            'phone'               => $this->phone,
            'delivery_method'     => $deliveryStr,
            'province_id'         => $this->province_id,
            'province_name'       => $this->province_name,
            'regency_id'          => $this->regency_id,
            'regency_name'        => $this->regency_name,
            'district_id'         => $this->district_id,
            'district_name'       => $this->district_name,
            'full_address'        => $this->full_address,
            'notes'               => $this->notes,
            'status'              => $statusStr,
            'rejection_reason'    => $this->rejection_reason,
            'payment_method'      => $this->payment_method ?? 'Transfer Bank',
            'bank_name'           => $this->bank_name,
            'buyer_shipping_cost' => $this->buyer_shipping_cost ?? 0,
            'plant_total'         => $plantTotal,
            'gross_plant_total'   => $grossPlantTotal,
            'sales_commission'    => $salesCommission,
            'return_total'        => $returnedAmount,
            'returned_package_count' => $this->packages ? $this->packages->filter(fn ($package) => filled($package->returned_at))->count() : 0,
            'returned_item_count' => $this->packages ? $this->packages->whereNotNull('returned_at')->sum(fn ($package) => $package->items->sum('quantity')) : 0,
            'returns'             => $this->whenLoaded('returns', fn () => $this->returns->map(fn ($return) => [
                'id' => $return->id, 'reason' => $return->reason, 'item_status' => $return->item_status,
                'notes' => $return->notes, 'refund_amount' => $return->refund_amount,
                'package_ids' => $return->package_ids, 'returned_at' => $return->returned_at?->toIso8601String(),
            ])),
            'is_verified'         => $isVerified,
            'payment_proof_url'   => $this->payment_proof_path ? asset('storage/' . $this->payment_proof_path) : null,
            'plant_photo_path'    => $this->plant_photo_path,
            'plant_photo_url'     => $this->plant_photo_path ? asset('storage/' . $this->plant_photo_path) : null,
            'payment_status'      => $this->payment_status ?? 'PENDING',
            ...(!$isSales ? ['shipping_cost' => $this->shipping_cost] : []),
            'tracking_number'     => $this->tracking_number,
            'creator'             => new UserResource($this->whenLoaded('creator')),
            'verifier'            => new UserResource($this->whenLoaded('verifier')),
            'items'               => OrderItemResource::collection($this->whenLoaded('items')),
            'packing_images'      => PackingImageResource::collection($this->whenLoaded('packingImages')),
            'packages'            => $this->whenLoaded('packages', fn () => $this->packages->map(fn ($package) => [
                'id' => $package->id, 'letter' => $package->letter, 'package_type' => $package->package_type,
                ...(!$isSales ? ['weight' => $package->weight] : []),
                ...(!$isSales ? ['shipping_cost' => $package->shipping_cost] : []),
                'status' => $package->status, 'configured_at' => $package->configured_at?->toIso8601String(), 'nota_printed' => $package->nota_printed, 'label_printed' => $package->label_printed,
                'returned' => filled($package->returned_at), 'return_status' => $package->return_status, 'return_amount' => $package->return_amount, 'returned_at' => $package->returned_at?->toIso8601String(),
                'photo_uploaded' => (bool) $package->photo_uploaded_at, 'tracking_number' => $package->tracking_number,
                'items' => $package->items->map(fn ($allocation) => ['order_item_id' => $allocation->order_item_id, 'quantity' => $allocation->quantity, 'product_name' => $allocation->item?->product_name]),
                'packing_images' => PackingImageResource::collection($package->packingImages),
            ])),
            'created_at'          => $this->created_at?->toIso8601String(),
            'verified_at'         => $this->verified_at?->toIso8601String(),
            'shipped_at'          => $this->shipped_at?->toIso8601String(),
            'completed_at'        => $this->completed_at?->toIso8601String(),
            'sales_informed_at'   => $this->sales_informed_at?->toIso8601String(),
        ];
    }
}
