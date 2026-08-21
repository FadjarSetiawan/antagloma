<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PrintJob extends Model
{
    protected $fillable = ['public_id', 'order_package_id', 'document_type', 'token_hash', 'expires_at', 'consumed_at', 'printed_at', 'printer', 'result', 'notes_override', 'layout_override'];
    protected $hidden = ['token_hash'];
    protected $casts = ['expires_at' => 'datetime', 'consumed_at' => 'datetime', 'printed_at' => 'datetime', 'result' => 'array', 'layout_override' => 'array'];
    public function package(): BelongsTo { return $this->belongsTo(OrderPackage::class, 'order_package_id'); }
}
