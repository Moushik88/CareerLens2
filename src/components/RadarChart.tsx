interface RadarPoint {
  label: string
  value: number
}

export function RadarChart({
  data,
  size = 280,
}: {
  data: RadarPoint[]
  size?: number
}) {
  const n = data.length || 1
  const cx = size / 2
  const cy = size / 2
  const radius = size * 0.34

  function point(i: number, value: number) {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n
    const r = (Math.max(0, Math.min(100, value)) / 100) * radius
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    }
  }

  const rings = [25, 50, 75, 100]
  const polygon = data
    .map((d, i) => {
      const p = point(i, d.value)
      return `${p.x},${p.y}`
    })
    .join(' ')

  return (
    <svg
      className="radar-chart"
      viewBox={`0 0 ${size} ${size}`}
      width="100%"
      height="auto"
      role="img"
      aria-label="Skill radar chart"
    >
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={data
            .map((_, i) => {
              const p = point(i, ring)
              return `${p.x},${p.y}`
            })
            .join(' ')}
          fill="none"
          stroke="rgba(148, 183, 204, 0.22)"
          strokeWidth="1"
        />
      ))}
      {data.map((d, i) => {
        const tip = point(i, 100)
        const labelR = radius + 28
        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n
        const lx = cx + labelR * Math.cos(angle)
        const ly = cy + labelR * Math.sin(angle)
        return (
          <g key={d.label}>
            <line
              x1={cx}
              y1={cy}
              x2={tip.x}
              y2={tip.y}
              stroke="rgba(148, 183, 204, 0.28)"
            />
            <text
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="var(--muted)"
              fontSize="11"
            >
              {d.label}
            </text>
            <text
              x={lx}
              y={ly + 14}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="var(--ink)"
              fontSize="11"
              fontWeight="700"
            >
              {Math.round(d.value)}
            </text>
          </g>
        )
      })}
      <polygon
        points={polygon}
        fill="rgba(45, 212, 191, 0.28)"
        stroke="var(--teal)"
        strokeWidth="2"
      />
      {data.map((d, i) => {
        const p = point(i, d.value)
        return <circle key={`dot-${d.label}`} cx={p.x} cy={p.y} r="3.5" fill="var(--teal)" />
      })}
    </svg>
  )
}
