import { useEffect, useState } from 'react';
import api from '../api';

export default function ReviewForm({ movieId }) {
  const [reviews, setReviews] = useState([]);
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = () => {
    api.get(`/movies/${movieId}/reviews`).then((res) => setReviews(res.data));
  };

  useEffect(() => {
    fetchReviews();
  }, [movieId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    await api.post(`/movies/${movieId}/reviews`, {
      reviewer_name: name.trim() || 'Anonymous',
      body: body.trim(),
    });
    setName('');
    setBody('');
    setSubmitting(false);
    fetchReviews();
  };

  return (
    <div className="review-section">
      <form onSubmit={submit} className="review-form">
        <input
          type="text"
          placeholder="Your name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <textarea
          placeholder="Write an honest review..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          required
        />
        <button type="submit" disabled={submitting}>
          {submitting ? 'Posting...' : 'Post Review'}
        </button>
      </form>

      <div className="review-list">
        {reviews.length === 0 && <p className="no-reviews">No reviews yet — be the first.</p>}
        {reviews.map((r) => (
          <div key={r.id} className="review-item">
            <strong>{r.reviewer_name}</strong>
            <p>{r.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
