<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OrderPackage extends Model {
    protected $fillable = ['order_id','letter','package_type','weight','configured_at','nota_printed','nota_printed_at','label_printed','label_printed_at','waiting_photo_at','photo_uploaded_at','tracking_number','shipping_cost','completed_at','return_status','returned_at','return_amount'];
    protected $casts = ['nota_printed'=>'boolean','label_printed'=>'boolean','configured_at'=>'datetime','nota_printed_at'=>'datetime','label_printed_at'=>'datetime','waiting_photo_at'=>'datetime','photo_uploaded_at'=>'datetime','completed_at'=>'datetime','returned_at'=>'datetime','weight'=>'float','shipping_cost'=>'float','return_amount'=>'float'];
    public function order(): BelongsTo { return $this->belongsTo(Order::class); }
    public function items(): HasMany { return $this->hasMany(OrderPackageItem::class); }
    public function packingImages(): HasMany { return $this->hasMany(PackingImage::class); }
    public function getStatusAttribute(): string { if ($this->completed_at) return 'COMPLETED'; if ($this->photo_uploaded_at) return 'WAITING_INPUT_RESI'; if ($this->nota_printed && $this->label_printed) return 'WAITING_PHOTO'; return 'DOCUMENT_PRINTING'; }
}
