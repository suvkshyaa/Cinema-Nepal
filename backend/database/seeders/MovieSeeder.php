<?php

namespace Database\Seeders;

use App\Models\Movie;
use Illuminate\Database\Seeder;

class MovieSeeder extends Seeder
{
    public function run(): void
    {
        $movies = [
            [
                'title' => 'Kabaddi',
                'genre' => 'Comedy/Drama',
                'release_year' => 2014,
                'poster_url' => 'https://placehold.co/300x445?text=Kabaddi',
                'trailer_url' => 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                'description' => 'A comedic look at cross-community romance in a Nepali village.',
            ],
            [
                'title' => 'Loot',
                'genre' => 'Crime/Drama',
                'release_year' => 2012,
                'poster_url' => 'https://placehold.co/300x445?text=Loot',
                'trailer_url' => 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                'description' => 'A dark comedy about a bank robbery gone wrong.',
            ],
            [
                'title' => 'Chha Maya Chha',
                'genre' => 'Romance',
                'release_year' => 2018,
                'poster_url' => 'https://placehold.co/300x445?text=Chha+Maya+Chha',
                'trailer_url' => 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                'description' => 'A modern love story set against the backdrop of Kathmandu.',
            ],
        ];

        foreach ($movies as $movie) {
            Movie::create($movie);
        }
    }
}
