<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApiCorsMiddleware
{
    private const ALLOWED_ORIGINS = ['https://floristyan.web.id'];

    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->is('api/*')) return $next($request);
        $origin = $request->headers->get('Origin');
        if ($request->isMethod('OPTIONS')) $response = response('', 204);
        else $response = $next($request);
        if (in_array($origin, self::ALLOWED_ORIGINS, true)) {
            $response->headers->set('Access-Control-Allow-Origin', $origin);
            $response->headers->set('Vary', 'Origin');
            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
            $response->headers->set('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept');
        }
        return $response;
    }
}
