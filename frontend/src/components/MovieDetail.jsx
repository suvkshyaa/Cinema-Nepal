import { useState, useEffect } from 'react';
import api from '../api';
import { timeAgo } from '../utils/timeAgo';
import { useAuth } from '../context/AuthContext';
import PollRing from './PollRing';
import EditMovieForm from './EditMovieForm';

function MovieDetail({ movie, onBack, onRequireAuth, onMovieUpdated, onMovieDeleted }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [votes, setVotes] = useState({ worth: 0, notWorth: 0 });
  const [myVote, setMyVote] = useState(null);
  const [pollLoading, setPollLoading] = useState(true);
  const [voteError, setVoteError] = useState('');

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    setPollLoading(true);
    setReviewsLoading(true);
    setVoteError('');
    setReviewError('');

    api
      .get(`/movies/${movie.id}/polls`)
      .then((res) => setVotes({ worth: res.data.worth, notWorth: res.data.not_worth }))
      .finally(() => setPollLoading(false));

    api
      .get(`/movies/${movie.id}/reviews`)
      .then((res) => setReviews(res.data))
      .finally(() => setReviewsLoading(false));
  }, [movie.id]);

  const totalVotes = votes.worth + votes.notWorth;
  const worthPercent = totalVotes > 0 ? Math.round((votes.worth / totalVotes) * 100) : 0;

  const handleVote = async (type) => {
    setVoteError('');
    if (!user) { onRequireAuth?.(); return; }
    if (user.role === 'admin') {
      setVoteError('Admin accounts cannot vote. Use a regular account instead.');
      return;
    }
    if (myVote) return;

    setMyVote(type);
    try {
      const res = await api.post(`/movies/${movie.id}/polls`, { vote: type });
      setVotes({ worth: res.data.worth, notWorth: res.data.not_worth });
    } catch (err) {
      setMyVote(null);
      setVoteError(err.response?.data?.message || 'Could not submit vote.');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError('');
    if (!user) { onRequireAuth?.(); return; }
    if (user.role === 'admin') {
      setReviewError('Admin accounts cannot post reviews. Use a regular account instead.');
      return;
    }
    if (!reviewText.trim()) return;

    setSubmitting(true);
    try {
      const res = await api.post(`/movies/${movie.id}/reviews`, { body: reviewText.trim() });
      setReviews((prev) => [res.data, ...prev]);
      setReviewText('');
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Could not post review.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleteError('');
    setDeleting(true);
    try {
      await api.delete(`/movies/${movie.id}`);
      onMovieDeleted?.(movie.id);
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Could not delete movie.');
      setDeleting(false);
    }
  };

  if (editing) {
    return (
      <EditMovieForm
        movie={movie}
        onCancel={() => setEditing(false)}
        onSaved={(updated) => {
          setEditing(false);
          onMovieUpdated?.(updated);
        }}
      />
    );
  }

  return (
    <div className="movie-detail">
      <div className="detail-top-row">
        <button className="link-btn back-btn" onClick={onBack}>← Back to movies</button>

        {isAdmin && (
          <div className="admin-actions">
            <button className="btn-secondary" onClick={() => setEditing(true)}>Edit</button>
            {!confirmDelete ? (
              <button className="btn-danger" onClick={() => setConfirmDelete(true)}>Delete</button>
            ) : (
              <span className="confirm-delete">
                Delete this movie permanently?
                <button className="btn-danger" onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'Deleting...' : 'Yes, delete'}
                </button>
                <button className="btn-secondary" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                  Cancel
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {deleteError && <p className="auth-error">{deleteError}</p>}

      <div className="detail-hero">
      {movie.poster && (
        <img
          src={movie.poster}
          alt={movie.title}
          className="detail-poster"
          onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/300x445?text=No+Poster'; }}
        />
      )}  
        <div className="detail-hero-info">
          <h1>{movie.title} <span className="detail-year">{movie.year}</span></h1>

          <div className="detail-genre-tags">
            {(movie.genre || '').split(',').map((g) => (
              <span key={g.trim()} className="genre-tag">{g.trim()}</span>
            ))}
          </div>

          {(movie.summary || movie.description) && (
            <p className="detail-description">{movie.summary || movie.description}</p>
          )}

          {movie.trailerUrl && (
            <div className="detail-trailer">
              <iframe src={movie.trailerUrl} title={`${movie.title} trailer`} allow="autoplay; encrypted-media" allowFullScreen />
            </div>
          )}
        </div>
      </div>

      <section className="detail-poll">
        <h2>Is it worth watching?</h2>

        {!pollLoading && (
          <div className="detail-poll-ring-row">
            <PollRing percent={worthPercent} totalVotes={totalVotes} size={110} />
            <div className="detail-poll-vote-count">
              {totalVotes > 0
                ? `Based on ${totalVotes} vote${totalVotes !== 1 ? 's' : ''}`
                : 'No votes yet — be the first!'}
            </div>
          </div>
        )}

        <div className="poll-buttons large">
          <button
            className={`btn-worth ${myVote === 'worth' ? 'selected' : ''}`}
            onClick={() => handleVote('worth')}
            disabled={!!myVote}
          >
            👍 Worth Watching
          </button>
          <button
            className={`btn-not-worth ${myVote === 'not_worth' ? 'selected' : ''}`}
            onClick={() => handleVote('not_worth')}
            disabled={!!myVote}
          >
            👎 Not Worth It
          </button>
        </div>

        {!user && <p className="auth-hint">Log in to vote on this movie.</p>}
        {myVote && <p className="voted-note">✓ Thanks for voting!</p>}
        {voteError && <p className="auth-error">{voteError}</p>}
      </section>

      <section className="detail-reviews">
        <h2>Reviews ({reviews.length})</h2>

        {user ? (
          <form className="review-form" onSubmit={handleReviewSubmit}>
            <textarea
              placeholder="Write an honest review..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={4}
              required
            />
            {reviewError && <p className="auth-error">{reviewError}</p>}
            <button type="submit" disabled={submitting}>
              {submitting ? 'Posting...' : 'Post Review'}
            </button>
          </form>
        ) : (
          <p className="auth-hint">
            <button className="link-btn" onClick={onRequireAuth}>Log in</button> to write a review.
          </p>
        )}

        <div className="review-list large">
          {reviewsLoading ? (
            <p className="no-reviews">Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <p className="no-reviews">No reviews yet — be the first!</p>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="review-item">
                <div className="review-header">
                  <strong>{r.reviewer_name}</strong>
                  {r.created_at && <span className="review-time">{timeAgo(r.created_at)}</span>}
                </div>
                <p>{r.body}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default MovieDetail;