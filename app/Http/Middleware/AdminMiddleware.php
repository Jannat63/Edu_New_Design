<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    /**
     * Allow only users whose role slug is 'admin'.
     * Already registered in bootstrap/app.php as the 'admin' alias.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || !$user->role || $user->role->slug !== 'admin') {
            return response()->json([
                'message' => 'Forbidden. Admin access only.',
            ], 403);
        }

        if ($user->is_banned) {
            return response()->json(['message' => 'Your account has been suspended.'], 403);
        }

        return $next($request);
    }
}
