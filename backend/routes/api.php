<?php

use App\Http\Controllers\MovieController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\PollController;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

// ---- Public: anyone can browse ----
Route::get('/movies', [MovieController::class, 'index']);
Route::get('/movies/{movie}', [MovieController::class, 'show']);
Route::get('/movies/{movie}/reviews', [ReviewController::class, 'index']);
Route::get('/movies/{movie}/polls', [PollController::class, 'results']);

// ---- Auth ----
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // ---- Requires login: vote & review (blocked for admins in the controller) ----
    Route::post('/movies/{movie}/reviews', [ReviewController::class, 'store']);
    Route::post('/movies/{movie}/polls', [PollController::class, 'store']);

    // ---- Requires login + admin role: manage movies ----
    Route::middleware('admin')->group(function () {
        Route::post('/movies', [MovieController::class, 'store']);
        Route::put('/movies/{movie}', [MovieController::class, 'update']);
        Route::delete('/movies/{movie}', [MovieController::class, 'destroy']);
    });
});
