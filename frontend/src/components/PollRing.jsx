function PollRing({ percent, totalVotes, size = 48 }) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  let color = '#e63946'; // red — not worth it
  let label = 'Skip It';
  if (percent >= 60) {
    color = '#2a9d8f'; // green — worth watching
    label = 'Worth It';
  } else if (percent >= 40) {
    color = '#e9c46a'; // amber — mixed
    label = 'Mixed';
  }

  const fontSize = size <= 60 ? size * 0.26 : size * 0.22;

  return (
    <div className="poll-ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="4"
        />
        {totalVotes > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
          />
        )}
      </svg>
      <div className="poll-ring-text" style={{ fontSize }}>
        {totalVotes > 0 ? `${percent}%` : '—'}
      </div>
      {size > 60 && totalVotes > 0 && (
        <div className="poll-ring-label" style={{ color }}>{label}</div>
      )}
    </div>
  );
}

export default PollRing;