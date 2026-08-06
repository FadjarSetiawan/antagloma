<?php

namespace App\Enums;

enum UserRole: string
{
    case OWNER = 'owner';
    case SALES = 'sales';
    case ADMIN = 'admin';
    case PACKING = 'packing';
}
