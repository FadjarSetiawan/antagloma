<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'tree_code',
        'tree_name',
        'grade',
        'product_name',
        'variant',
        'quantity',
        'price',
        'standard_price',
        'discount',
        'notes',
    ];

    protected $casts = [
        'quantity'       => 'integer',
        'price'          => 'float',
        'standard_price' => 'float',
        'discount'       => 'float',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
