<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PollVote extends Model
{
    use HasFactory;

    protected $fillable = ['movie_id', 'vote'];

    public function movie()
    {
        return $this->belongsTo(Movie::class);
    }
}
