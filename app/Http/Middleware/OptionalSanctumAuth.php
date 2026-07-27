<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * "Optional" Sanctum auth for public-but-personalized endpoints.
 *
 * Without this, $request->user() on a route that has NO auth middleware at
 * all always returns null — even with a valid Bearer token — because
 * Laravel resolves $request->user() against the *default* guard ('web',
 * session-based), and only auth:sanctum's own Authenticate middleware calls
 * Auth::shouldUse('sanctum') to switch the request's active guard. That
 * middleware also rejects the request with a 401 if there's no token, which
 * is wrong for a page anyone (logged in or not) should be able to view.
 *
 * This does the same guard-switch on success, but never blocks: no token,
 * invalid token, or expired token all just fall through as a guest.
 *
 * Found while building the bundle "already owned" check — the same bug was
 * already live on GET /courses/{slug} and /courses/{slug}/lessons, silently
 * making `is_enrolled` (and the video_url/locked gating derived from it)
 * always evaluate as "not enrolled" for logged-in users on those two routes.
 */
class OptionalSanctumAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->bearerToken() && Auth::guard('sanctum')->check()) {
            Auth::shouldUse('sanctum');
        }

        return $next($request);
    }
}
