<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Required by bootstrap/app.php's $middleware->throttleApi() call —
        // that method only ATTACHES the 'throttle:api' middleware to API
        // routes, it does NOT define what the 'api' limiter actually does.
        // Without this registration, every API request throws
        // "Rate limiter [api] is not defined."
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });
    }
}
