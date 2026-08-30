import { useState } from 'react';
import api from '../api';

function EditMovieForm({ movie, onSaved, onCancel }) {
  const [form, setForm] = useState({
    title: movie.title || '',
    genre: movie.genre || '',
    release_year: movie.release_year || '',
    trailer_url: movie.trailer_url || '',
    description: movie.description || '',
  });
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState(movie.poster_url || null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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
    setSubmitting(true);

    const data = new FormData();
    data.append('title', form.title);
    data.append('genre', form.genre);
    data.append('release_year', form.release_year);
    data.append('trailer_url', form.trailer_url);
    data.append('description', form.description);
    if (posterFile) data.append('poster', posterFile);
    data.append('_method', 'PUT'); // Laravel method spoofing for multipart PUT

    try {
      const res = await api.post(`/movies/${movie.id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onSaved?.(res.data);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        Object.values(err.response?.data?.errors || {})[0]?.[0] ||
        'Could not save changes.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-form-wrap">
      <h1>Edit Movie</h1>
      <p className="tagline">Update details, or leave the poster as-is unless you want to replace it.</p>

      <form className="admin-form" onSubmit={handleSubmit}>
        <label>
          Title
          <input type="text" name="title" value={form.title} onChange={handleChange} required />
        </label>

        <label>
          Genre
          <input type="text" name="genre" value={form.genre} onChange={handleChange} required />
        </label>

        <label>
          Release Year
          <input type="number" name="release_year" value={form.release_year} onChange={handleChange} min="1900" max="2100" required />
        </label>

        <label>
          Poster Image (leave blank to keep current poster)
          <input type="file" accept="image/png, image/jpeg, image/webp" onChange={handlePosterChange} />
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

        <div className="admin-form-actions">
          <button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditMovieForm;