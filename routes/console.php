<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Runs hourly; the command itself only acts on payments that have been
// pending for 1–168 hours and haven't been reminded yet, so running it
// more often than that window is harmless (it'll just find nothing new).
Schedule::command('checkout:send-reminders')->hourly();
