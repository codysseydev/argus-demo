<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\SpaController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/argus');

// Minimal session auth. The SPA has no login of its own; it rides this session.
Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'show'])->name('login');
    Route::post('/login', [LoginController::class, 'store']);
});

Route::post('/logout', [LoginController::class, 'destroy'])
    ->middleware('auth')
    ->name('logout');

// The Argus React SPA. The catch-all hands every /argus/* path back to index.html
// so client-side routing works; built JS/CSS under public/argus/ are served
// statically. Same origin as /argus-api, so the session cookie authorizes the API.
Route::middleware('auth')
    ->get('/argus/{path?}', SpaController::class)
    ->where('path', '.*')
    ->name('argus.spa');
