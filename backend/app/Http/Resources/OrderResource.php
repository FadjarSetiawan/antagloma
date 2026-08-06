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
            'payment_method'      => $this->payment_method ?? 'Transfer Bank',
            'bank_name'           => $this->bank_name,
            'buyer_shipping_cost' => $this->buyer_shipping_cost ?? 0,
            'payment_proof_url'   => $this->payment_proof_path ? asset('storage/' . $this->payment_proof_path) : null,
            'payment_status'      => $this->payment_status ?? 'PENDING',
            'shipping_cost'       => $this->shipping_cost,
            'tracking_number'     => $this->tracking_number,
            'creator'             => new UserResource($this->whenLoaded('creator')),
            'verifier'            => new UserResource($this->whenLoaded('verifier')),
            'items'               => OrderItemResource::collection($this->whenLoaded('items')),
            'packing_images'      => PackingImageResource::collection($this->whenLoaded('packingImages')),
            'created_at'          => $this->created_at?->toIso8601String(),
            'verified_at'         => $this->verified_at?->toIso8601String(),
            'shipped_at'          => $this->shipped_at?->toIso8601String(),
            'completed_at'        => $this->completed_at?->toIso8601String(),
        ];
    }
}
