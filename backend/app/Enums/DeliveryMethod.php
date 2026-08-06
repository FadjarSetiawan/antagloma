<?php

namespace App\Enums;

enum DeliveryMethod: string
{
    case KIRIM_PAKET  = 'Kirim Paket';
    case PACKING_KAYU = 'Packing Kayu';
    case AMBIL_TEMPAT = 'Ambil di Tempat';
    case ANTAR_RUMAH  = 'Antar ke Rumah';
}
