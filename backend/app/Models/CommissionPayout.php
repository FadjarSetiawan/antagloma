<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class CommissionPayout extends Model
{
    use HasFactory;

    protected $table = 'commission_payouts';

    protected $fillable = [
        'sales_id',
        'month',
        'period_start',
        'period_end',
        'amount',
        'payment_proof_path',
        'notes',
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end'   => 'date',
    ];

    public function sales(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sales_id');
    }

    public function orders(): BelongsToMany
    {
        return $this->belongsToMany(Order::class, 'commission_payout_orders', 'payout_id', 'order_id')
                    ->withTimestamps();
    }
}

