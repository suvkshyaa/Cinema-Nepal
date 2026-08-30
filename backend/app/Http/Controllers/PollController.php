<?php

namespace App\Http\Controllers;

use App\Models\Movie;
use Illuminate\Http\Request;

class PollController extends Controller
{
    public function results(Movie $movie)
    {
        return [
            'worth' => $movie->pollVotes()->where('vote', 'worth')->count(),
            'not_worth' => $movie->pollVotes()->where('vote', 'not_worth')->count(),
        ];
    }

    public function store(Request $request, Movie $movie)
    {
        $user = $request->user();

        if ($user->isAdmin()) {
            return response()->json(['message' => 'Admin accounts cannot vote.'], 403);
        }

        $alreadyVoted = $movie->pollVotes()->where('user_id', $user->id)->exists();
        if ($alreadyVoted) {
            return response()->json(['message' => 'You have already voted on this movie.'], 409);
        }

        $validated = $request->validate([
            'vote' => 'required|in:worth,not_worth',
        ]);

        $movie->pollVotes()->create([
            'vote' => $validated['vote'],
            'user_id' => $user->id,
        ]);

        return $this->results($movie);
    }
}
