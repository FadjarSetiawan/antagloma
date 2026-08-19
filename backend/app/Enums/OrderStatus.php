<?php

namespace App\Enums;

enum OrderStatus: string
{
    case WAITING_PROCESS   = 'WAITING_PROCESS';
    case WAITING_PACKING   = 'WAITING_PACKING';
    case PACKING_COMPLETED = 'PACKING_COMPLETED';
    case COMPLETED         = 'COMPLETED';
    case RETURNED_PARTIAL  = 'RETURNED_PARTIAL';
    case RETURNED          = 'RETURNED';
    case CANCELLED         = 'CANCELLED';
}
