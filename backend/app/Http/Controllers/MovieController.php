<?php

namespace App\Http\Controllers;

use App\Models\Movie;
use Illuminate\Http\Request;

class MovieController extends Controller
{
    public function index()
    {
        return Movie::withCount([
            'pollVotes as worth_count' => fn ($q) => $q->where('vote', 'worth'),
            'pollVotes as not_worth_count' => fn ($q) => $q->where('vote', 'not_worth'),
        ])->orderByDesc('release_year')->get();
    }

    public function show(Movie $movie)
    {
        return $movie;
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:150',
            'genre' => 'required|string|max:100',
            'release_year' => 'required|integer|min:1900|max:2100',
            'poster' => 'required|image|mimes:jpg,jpeg,png,webp|max:4096', // 4MB max
            'trailer_url' => 'required|url',
            'description' => 'required|string|max:2000',
        ]);

        $path = $request->file('poster')->store('posters', 'public');

        $movie = Movie::create([
            'title' => $validated['title'],
            'genre' => $validated['genre'],
            'release_year' => $validated['release_year'],
            'poster_url' => url('storage/' . $path), // full absolute URL
            'trailer_url' => $validated['trailer_url'],
            'description' => $validated['description'],
        ]);

        return response()->json($movie, 201);
    }

    public function update(Request $request, Movie $movie)
    {
        $validated = $request->validate([
            'title' => 'sometimes|string|max:150',
            'genre' => 'sometimes|string|max:100',
            'release_year' => 'sometimes|integer|min:1900|max:2100',
            'poster' => 'sometimes|image|mimes:jpg,jpeg,png,webp|max:4096',
            'trailer_url' => 'sometimes|url',
            'description' => 'sometimes|string|max:2000',
        ]);

        if ($request->hasFile('poster')) {
            $path = $request->file('poster')->store('posters', 'public');
            $validated['poster_url'] = url('storage/' . $path); // full absolute URL
        }

        $movie->update($validated);

        return response()->json($movie);
    }

    public function destroy(Movie $movie)
    {
        $movie->delete();

        return response()->json(['message' => 'Movie deleted.']);
    }
}
