<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\PackingImage;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PackingService
{
    public function uploadPackingProof(Order $order, UploadedFile $file, ?string $notes, User $user): PackingImage
    {
        $currentStatus = $order->status instanceof \BackedEnum ? $order->status->value : (string) $order->status;
        
        // Prevent upload only if order is already COMPLETED or CANCELLED
        if (in_array($currentStatus, [OrderStatus::COMPLETED->value, OrderStatus::CANCELLED->value])) {
            throw ValidationException::withMessages([
                'status' => ['Foto packing tidak dapat diunggah karena pesanan telah selesai (COMPLETED) atau dibatalkan.']
            ]);
        }

        return DB::transaction(function () use ($order, $file, $notes, $user) {
            $extension = $file->getClientOriginalExtension();
            $filename = Str::uuid()->toString() . '.' . $extension;
            $path = $file->storeAs('packing_proofs/' . date('Y/m'), $filename, 'public');

            $packingImage = PackingImage::create([
                'order_id'      => $order->id,
                'image_path'    => $path,
                'original_name' => $file->getClientOriginalName(),
                'notes'         => isset($notes) ? strip_tags($notes) : null,
                'uploaded_by'   => $user->id,
            ]);

            // Auto transition order status to PACKING_COMPLETED when staff packing uploads photo
            $order->update([
                'status' => OrderStatus::PACKING_COMPLETED,
            ]);

            AuditLogService::logSecurityEvent('PACKING_PROOF_UPLOADED', $user, [
                'order_id'     => $order->id,
                'order_number' => $order->order_number,
                'image_id'     => $packingImage->id,
            ]);

            return $packingImage;
        });
    }
}
