<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Movie extends Model
{
    use HasFactory;

    protected $fillable = [
        'title', 'genre', 'release_year', 'poster_url', 'trailer_url', 'description',
    ];

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function pollVotes()
    {
        return $this->hasMany(PollVote::class);
    }
}
