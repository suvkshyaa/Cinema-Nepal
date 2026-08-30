import { useState } from 'react';

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
            onError={(e) => { e.target.onerror = null; e.target.src = '/fallback-poster.png'; }}
          />
        ) : (
          <div className="no-trailer">No poster available</div>
        )}
        {totalVotes > 0 && <span className="worth-badge">{worthPercent}% 👍</span>}
        <div className="play-overlay">▶</div>
      </div>

      <h3>{movie.title}</h3>
      <p className="movie-meta">{movie.year} · {movie.genre}</p>

      <div className="card-poll-preview">
        <div className="poll-bar">
          <div className="poll-bar-fill" style={{ width: `${worthPercent}%` }} />
        </div>
        <span>{worthPercent}% worth watching · {movie.reviewCount || 0} reviews</span>
      </div>

      <button className="link-btn" onClick={(e) => { e.stopPropagation(); onOpen(movie); }}>
        View poll & reviews →
      </button>
    </div>
  );
}

export default MovieCard;