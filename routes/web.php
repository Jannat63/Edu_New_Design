<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| All web requests return the React SPA shell. React Router handles
| client-side routing for all frontend pages.
|
*/

Route::get('/{any?}', function () {
    return view('app');
})->where('any', '.*');
