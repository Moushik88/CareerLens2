interface ScoreRingProps {
  score: number
  label: string
}

export function ScoreRing({ score, label }: ScoreRingProps) {
  const radius = 90
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="score-ring-wrap">
      <svg className="score-ring" viewBox="0 0 220 220">
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2dd4bf" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
        <circle className="track" cx="110" cy="110" r={radius} />
        <circle
          className="progress"
          cx="110"
          cy="110"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="score-center">
        <strong>{score}</strong>
        <span>{label}</span>
      </div>
    </div>
  )
}
