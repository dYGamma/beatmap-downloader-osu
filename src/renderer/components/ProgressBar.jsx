export default function ProgressBar({ value = 0, max = 100, label }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0

  return (
    <div>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
          <span>{label}</span>
          <span style={{ color: 'var(--text-muted)' }}>{value} / {max}</span>
        </div>
      )}
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
