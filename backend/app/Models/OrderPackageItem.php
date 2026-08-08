<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class OrderPackageItem extends Model { protected $fillable = ['order_package_id','order_item_id','quantity']; public function item() { return $this->belongsTo(OrderItem::class, 'order_item_id'); } }
