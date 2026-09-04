import { useState } from 'react';
import PollRing from './PollRing';

function MovieCard({ movie, onOpen }) {
  const [showTrailer, setShowTrailer] = useState(false);

  const totalVotes = (movie.worthCount || 0) + (movie.notWorthCount || 0);
  const worthPercent = totalVotes > 0
    ? Math.round((movie.worthCount / totalVotes) * 100)
    : 0;

  return (
    <div className="movie-card" onClick={() => onOpen(movie)}>
      <div
        className="movie-poster-wrap"
        onMouseEnter={() => setShowTrailer(true)}
        onMouseLeave={() => setShowTrailer(false)}
      >
      {movie.poster ? (
      <img
        src={movie.poster}
        alt={movie.title}
        className="movie-poster"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = 'https://placehold.co/300x445?text=No+Poster';
        }}
      />
      ) : (
      <div className="no-trailer">No poster available</div>
    )}
        

        <div className="card-poll-ring">
          <PollRing percent={worthPercent} totalVotes={totalVotes} size={44} />
        </div>

        <div className="play-overlay">▶</div>
      </div>

      <h3>{movie.title}</h3>
      <p className="movie-meta">{movie.year} · {movie.genre}</p>

      <button
        className="link-btn"
        onClick={(e) => { e.stopPropagation(); onOpen(movie); }}
      >
        View poll & reviews →
      </button>
    </div>
  );
}

export default MovieCard;