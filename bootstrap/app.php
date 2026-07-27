<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\OptionalSanctumAuth;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web:      __DIR__.'/../routes/web.php',
        api:      __DIR__.'/../routes/api.php',
        apiPrefix: 'api',
        commands: __DIR__.'/../routes/console.php',
        health:   '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // NOTE: Maintenance mode is intentionally handled entirely on the frontend
        // (see resources/js/lib/MaintenanceGate.jsx), not here. A backend
        // middleware that blocks the HTML shell itself creates a lockout risk:
        // plain browser navigation never sends a bearer token, so even an
        // admin would get a raw 503 instead of the page loading — with no way
        // back in through the UI. The frontend gate checks the logged-in
        // user's role after the app has already loaded, which is safe.
        // Register the admin guard — already wired, nothing to do!
        $middleware->alias([
            'admin'         => AdminMiddleware::class,
            'optional.auth' => OptionalSanctumAuth::class,
        ]);

        // Laravel 11 applies NO default rate limit to API routes (unlike
        // older Laravel versions). 60 requests/minute per user (or per IP
        // for guests) is a sane baseline so the API can't be hammered.
        // Tighter limits are applied per-route for auth endpoints (see
        // routes/api.php) since those are higher-risk (brute force, spam).
        $middleware->throttleApi();
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
