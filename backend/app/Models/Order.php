<?php

namespace App\Models;

use App\Enums\DeliveryMethod;
use App\Enums\OrderStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_number',
        'order_date',
        'customer_name',
        'phone',
        'delivery_method',
        'province_id',
        'province_name',
        'regency_id',
        'regency_name',
        'district_id',
        'district_name',
        'full_address',
        'notes',
        'status',
        'rejection_reason',
        'payment_method',
        'bank_name',
        'buyer_shipping_cost',
        'payment_proof_path',
        'payment_status',
        'shipping_cost',
        'tracking_number',
        'created_by',
        'verified_by',
        'verified_at',
        'shipped_at',
        'completed_at',
        'sales_informed_at',
    ];

    protected $casts = [
        'status'              => OrderStatus::class,
        'delivery_method'     => DeliveryMethod::class,
        'order_date'          => 'date:Y-m-d',
        'verified_at'         => 'datetime',
        'shipped_at'          => 'datetime',
        'completed_at'        => 'datetime',
        'sales_informed_at'   => 'datetime',
        'shipping_cost'       => 'float',
        'buyer_shipping_cost' => 'float',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function packingImages(): HasMany
    {
        return $this->hasMany(PackingImage::class);
    }

    public function packages(): HasMany { return $this->hasMany(OrderPackage::class); }
}
