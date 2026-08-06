<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MasterGrade extends Model
{
    use HasFactory;

    protected $fillable = [
        'grade',
        'standard_price',
    ];

    protected $casts = [
        'standard_price' => 'float',
    ];
}
