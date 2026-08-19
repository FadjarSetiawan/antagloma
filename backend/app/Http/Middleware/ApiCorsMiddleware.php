<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApiCorsMiddleware
{
    private const ALLOWED_ORIGINS = [
        'https://antaglomaflorist.id',
        'https://www.antaglomaflorist.id',
        // Keep the development domain available during the migration window.
        'https://floristyan.web.id',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $origin = $request->headers->get('Origin');
        // Handle preflight before route matching. This is important on the
        // production API subdomain where /api/login is a POST-only route.
        if ($request->isMethod('OPTIONS')) {
            $response = response('', 204);
        } else {
            $response = $next($request);
        }
        if ($origin && in_array($origin, self::ALLOWED_ORIGINS, true)) {
            $response->headers->set('Access-Control-Allow-Origin', $origin);
            $response->headers->set('Vary', 'Origin');
            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
            $response->headers->set('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept, X-Requested-With, Origin');
            $response->headers->set('Access-Control-Max-Age', '86400');
        }
        return $response;
    }
}
