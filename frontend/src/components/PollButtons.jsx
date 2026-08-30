import { useEffect, useState } from 'react';
import api from '../api';

export default function PollButtons({ movieId }) {
  const [results, setResults] = useState({ worth: 0, not_worth: 0 });
  const [voted, setVoted] = useState(false);

  const fetchResults = () => {
    api.get(`/movies/${movieId}/polls`).then((res) => setResults(res.data));
  };

  useEffect(() => {
    fetchResults();
  }, [movieId]);

  const vote = async (choice) => {
    await api.post(`/movies/${movieId}/polls`, { vote: choice });
    setVoted(true);
    fetchResults();
  };

  const total = results.worth + results.not_worth || 1;
  const worthPct = Math.round((results.worth / total) * 100);

  return (
    <div className="poll-box">
      <div className="poll-buttons">
        <button onClick={() => vote('worth')} className="btn-worth">👍 Worth Watching</button>
        <button onClick={() => vote('not_worth')} className="btn-not-worth">👎 Not Worth It</button>
      </div>
      {(voted || total > 1) && (
        <div className="poll-results">
          <div className="poll-bar">
            <div className="poll-bar-fill" style={{ width: `${worthPct}%` }} />
          </div>
          <span>{worthPct}% say worth watching ({results.worth + results.not_worth} votes)</span>
        </div>
      )}
    </div>
  );
}
