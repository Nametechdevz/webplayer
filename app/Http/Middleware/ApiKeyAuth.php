<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApiKeyAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        $apiKey = $request->header('X-Merchant-Key');

        if (!$apiKey) {
            return response()->json([
                'success' => false,
                'message' => 'X-Merchant-Key header is required',
            ], 401);
        }

        return $next($request);
    }
}
