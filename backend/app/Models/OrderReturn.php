<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderReturn extends Model
{
    protected $fillable = ['order_id', 'processed_by', 'reason', 'item_status', 'notes', 'refund_amount', 'package_ids', 'returned_at'];
    protected $casts = ['package_ids' => 'array', 'refund_amount' => 'float', 'returned_at' => 'datetime'];
    public function order(): BelongsTo { return $this->belongsTo(Order::class); }
    public function processor(): BelongsTo { return $this->belongsTo(User::class, 'processed_by'); }
}
