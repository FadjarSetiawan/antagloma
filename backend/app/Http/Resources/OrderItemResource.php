<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'tree_code'      => $this->tree_code,
            'tree_name'      => $this->tree_name,
            'grade'          => $this->grade,
            'product_name'   => $this->product_name,
            'variant'        => $this->variant,
            'quantity'       => $this->quantity,
            'price'          => $this->price,
            'standard_price' => $this->standard_price,
            'discount'       => $this->discount,
            'notes'          => $this->notes,
        ];
    }
}
