<?php

namespace App\Http\Controllers;

use App\Models\Movie;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function index(Movie $movie)
    {
        return $movie->reviews()->latest()->get();
    }

    public function store(Request $request, Movie $movie)
    {
        $user = $request->user();

        if ($user->isAdmin()) {
            return response()->json(['message' => 'Admin accounts cannot post reviews.'], 403);
        }

        $validated = $request->validate([
            'body' => 'required|string|max:2000',
        ]);

        $review = $movie->reviews()->create([
            'reviewer_name' => $user->name,
            'body' => $validated['body'],
            'user_id' => $user->id,
        ]);

        return response()->json($review, 201);
    }
}
