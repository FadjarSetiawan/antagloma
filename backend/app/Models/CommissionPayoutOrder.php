<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommissionPayoutOrder extends Model
{
    protected $table = 'commission_payout_orders';

    protected $fillable = [
        'payout_id',
        'order_id',
    ];

    public function payout(): BelongsTo
    {
        return $this->belongsTo(CommissionPayout::class, 'payout_id');
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id');
    }
}
