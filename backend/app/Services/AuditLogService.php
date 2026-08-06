<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Log;

class AuditLogService
{
    public static function logSecurityEvent(string $event, ?User $user = null, array $details = []): void
    {
        $payload = [
            'timestamp'  => now()->toIso8601String(),
            'event'      => $event,
            'user_id'    => $user?->id,
            'user_email' => $user?->email,
            'role'       => $user?->role,
            'ip'         => request()->ip(),
            'user_agent' => request()->userAgent(),
            'details'    => $details,
        ];

        Log::info('[SECURITY_AUDIT] ' . $event, $payload);
    }
}
