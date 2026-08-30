import { useEffect, useState, useMemo, useCallback } from 'react';
import api from './api';
import MovieCard from './components/MovieCard';
import MovieDetail from './components/MovieDetail';
import AuthForm from './components/AuthForm';
import AdminMovieForm from './components/AdminMovieForm';
import { useAuth } from './context/AuthContext';
import './App.css';

function App() {
  const { user, loading: authLoading, logout } = useAuth();

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('cinema'); // 'cinema' | 'genre' | 'admin'
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showAuth, setShowAuth] = useState(false);

  const fetchMovies = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .get('/movies')
      .then((res) => {
        const mapped = res.data.map((m) => ({
          ...m,
          poster: m.poster_url,
          year: m.release_year,
          trailerUrl: m.trailer_url,
        }));
        setMovies(mapped);
      })
      .catch(() => setError('Could not load movies. Is the backend running?'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  const genreGroups = useMemo(() => {
    return movies.reduce((acc, movie) => {
      const genre = movie.genre || 'Uncategorized';
      if (!acc[genre]) acc[genre] = [];
      acc[genre].push(movie);
      return acc;
    }, {});
  }, [movies]);

  return (
    <div className="app">
      {/* ---- Header ---- */}
      <header className="site-header">
        <div className="site-header-inner">
          <div>
            <button
              className="brand brand-link"
              onClick={() => { setView('cinema'); setSelectedMovie(null); }}
            >
              <span className="brand-logo">🎬</span>
              Cinema Nepal
            </button>
            <p className="tagline">Trailers, honest reviews, and worth-watching polls for Nepali movies</p>
          </div>

          <nav className="view-tabs">
            <button
              className={view === 'cinema' ? 'tab active' : 'tab'}
              aria-pressed={view === 'cinema'}
              onClick={() => { setView('cinema'); setSelectedMovie(null); }}
            >
              Now on Cinema
            </button>
            <button
              className={view === 'genre' ? 'tab active' : 'tab'}
              aria-pressed={view === 'genre'}
              onClick={() => { setView('genre'); setSelectedMovie(null); }}
            >
              Genres
            </button>

            {user?.role === 'admin' && (
              <button
                className={view === 'admin' ? 'tab active' : 'tab'}
                aria-pressed={view === 'admin'}
                onClick={() => { setView('admin'); setSelectedMovie(null); }}
              >
                + Add Movie
              </button>
            )}

            {!authLoading && (
              user ? (
                <div className="auth-status">
                  <span className="auth-username">{user.name}</span>
                  <button className="tab" onClick={logout}>Log out</button>
                </div>
              ) : (
                <button className="tab" onClick={() => setShowAuth(true)}>Log in</button>
              )
            )}
          </nav>
        </div>
      </header>

      {/* ---- Main content ---- */}
      <main className="app-main">
        {view === 'admin' && user?.role === 'admin' ? (
          <AdminMovieForm onMovieAdded={fetchMovies} />
        ) : selectedMovie ? (
          <MovieDetail
            movie={selectedMovie}
            onBack={() => setSelectedMovie(null)}
            onRequireAuth={() => setShowAuth(true)}
            onMovieUpdated={(updated) => {
              const mapped = {
                ...updated,
                poster: updated.poster_url,
                year: updated.release_year,
                trailerUrl: updated.trailer_url,
              };
              setMovies((prev) => prev.map((m) => (m.id === mapped.id ? mapped : m)));
              setSelectedMovie(mapped);
            }}
            onMovieDeleted={(id) => {
              setMovies((prev) => prev.filter((m) => m.id !== id));
              setSelectedMovie(null);
            }}
          />
        ) : (
          <>
            {loading && <p className="status">Loading movies...</p>}
            {error && (
              <p className="status error">
                {error} <button className="link-btn" onClick={fetchMovies}>Retry</button>
              </p>
            )}
            {!loading && !error && movies.length === 0 && (
              <p className="status">No movies yet — check back soon!</p>
            )}

            {view === 'cinema' && !loading && !error && movies.length > 0 && (
              <div className="movie-grid">
                {movies.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} onOpen={setSelectedMovie} />
                ))}
              </div>
            )}

            {view === 'genre' &&
              Object.entries(genreGroups).map(([genre, genreMovies]) => (
                <section key={genre} className="genre-section">
                  <h2 className="genre-title">{genre}</h2>
                  <div className="movie-grid">
                    {genreMovies.map((movie) => (
                      <MovieCard key={movie.id} movie={movie} onOpen={setSelectedMovie} />
                    ))}
                  </div>
                </section>
              ))}
          </>
        )}
      </main>

      {/* ---- Footer ---- */}
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-col">
            <h4>Cinema Nepal</h4>
            <p style={{ maxWidth: '280px' }}>
              A community-driven hub for Nepali movies — honest reviews and
              worth-watching polls, not just ratings.
            </p>
          </div>
          <div className="footer-col">
            <h4>Browse</h4>
            <a href="#" onClick={(e) => { e.preventDefault(); setView('cinema'); setSelectedMovie(null); }}>Now on Cinema</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setView('genre'); setSelectedMovie(null); }}>Genres</a>
          </div>
          <div className="footer-col">
            <h4>About</h4>
            <a href="#">Contact Us</a>
            <a href="#">Submit a Movie</a>
            <a href="#">Report an Issue</a>
          </div>
        </div>
        <div className="footer-bottom">
          © {new Date().getFullYear()} Cinema Nepal. Made for the Nepali film community.
        </div>
      </footer>

      {showAuth && <AuthForm onClose={() => setShowAuth(false)} />}
    </div>
  );
}

export default App;