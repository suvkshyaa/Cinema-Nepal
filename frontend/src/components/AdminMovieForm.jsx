import { useState } from 'react';
import api from '../api';

function AdminMovieForm({ onMovieAdded }) {
  const [form, setForm] = useState({
    title: '',
    genre: '',
    release_year: '',
    trailer_url: '',
    description: '',
  });
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePosterChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPosterFile(file);
    setPosterPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!posterFile) {
      setError('Please choose a poster image.');
      return;
    }

    setSubmitting(true);

    const data = new FormData();
    data.append('title', form.title);
    data.append('genre', form.genre);
    data.append('release_year', form.release_year);
    data.append('trailer_url', form.trailer_url);
    data.append('description', form.description);
    data.append('poster', posterFile);

    try {
      await api.post('/movies', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess(true);
      setForm({ title: '', genre: '', release_year: '', trailer_url: '', description: '' });
      setPosterFile(null);
      setPosterPreview(null);
      onMovieAdded?.();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        Object.values(err.response?.data?.errors || {})[0]?.[0] ||
        'Could not add movie.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-form-wrap">
      <h1>Add a Movie</h1>
      <p className="tagline">Poster, trailer, and details only — reviews and polls are for registered viewers.</p>

      <form className="admin-form" onSubmit={handleSubmit}>
        <label>
          Title
          <input type="text" name="title" value={form.title} onChange={handleChange} required />
        </label>

        <label>
          Genre
          <input type="text" name="genre" value={form.genre} onChange={handleChange} placeholder="e.g. Comedy/Drama" required />
        </label>

        <label>
          Release Year
          <input type="number" name="release_year" value={form.release_year} onChange={handleChange} min="1900" max="2100" required />
        </label>

        <label>
          Poster Image
          <input type="file" accept="image/png, image/jpeg, image/webp" onChange={handlePosterChange} required />
        </label>

        {posterPreview && (
          <img src={posterPreview} alt="Poster preview" className="poster-preview" />
        )}

        <label>
          Trailer URL (YouTube embed link)
          <input type="url" name="trailer_url" value={form.trailer_url} onChange={handleChange} placeholder="https://www.youtube.com/embed/..." required />
        </label>

        <label>
          Description
          <textarea name="description" value={form.description} onChange={handleChange} rows={4} required />
        </label>

        {error && <p className="auth-error">{error}</p>}
        {success && <p className="voted-note">✓ Movie added successfully!</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Adding...' : 'Add Movie'}
        </button>
      </form>
    </div>
  );
}

export default AdminMovieForm;