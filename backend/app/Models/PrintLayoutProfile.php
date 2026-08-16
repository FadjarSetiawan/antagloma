<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PrintLayoutProfile extends Model
{
    protected $fillable = ['document_type', 'layout'];
    protected $casts = ['layout' => 'array'];
}
