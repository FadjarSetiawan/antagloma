<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class PackingImageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'            => $this->id,
            'image_url'     => $this->image_path ? url('/api/storage/' . ltrim($this->image_path, '/')) : null,
            'original_name' => $this->original_name,
            'notes'         => $this->notes,
            'uploader'      => new UserResource($this->whenLoaded('uploader')),
            'created_at'    => $this->created_at->toIso8601String(),
        ];
    }
}
