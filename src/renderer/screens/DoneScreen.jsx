import { useState, useEffect } from 'react'
import Button from '../components/Button'

function useCountUp(target, duration = 800) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (target === 0) return
    const startTime = performance.now()
    let frameId
    function tick(now) {
      const progress = Math.min((now - startTime) / duration, 1)
      setValue(Math.round(progress * target))
      if (progress < 1) frameId = requestAnimationFrame(tick)
    }
    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [target, duration])
  return value
}

function AnimatedCheckmark() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" style={{ margin: '0 auto 24px', display: 'block' }}>
      <circle
        cx="36" cy="36" r="34"
        stroke="#1A1A2E"
        strokeWidth="2.5"
        fill="rgba(255,107,107,0.08)"
      />
      <path
        d="M20 36 L30 46 L52 24"
        stroke="#FF6B6B"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="checkmark-path"
      />
    </svg>
  )
}

function StatBox({ label, value, color }) {
  const display = useCountUp(value)
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 38, fontWeight: 800, color, lineHeight: 1 }}>{display.toLocaleString()}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{label}</div>
    </div>
  )
}

export default function DoneScreen({ results, folder, onRestart }) {
  return (
    <div className="screen screen-centered">
      <div style={{ width: 400, textAlign: 'center' }}>
        <AnimatedCheckmark />
        <p style={{ fontSize: 11, letterSpacing: '0.1em', color: 'var(--accent)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>
          Готово!
        </p>
        <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 32 }}>Загрузка завершена</h2>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 48, marginBottom: 40 }}>
          <StatBox label="Скачано" value={results.downloaded || 0} color="#4CAF50" />
          <StatBox label="Пропущено" value={results.skipped || 0} color="#888" />
          <StatBox label="Ошибок" value={results.failed || 0} color="#FF6B6B" />
        </div>

        {results.failed > 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 28, lineHeight: 1.7 }}>
            Ошибки могут означать, что карта удалена с osu!<br />или временно недоступна на зеркалах.
          </p>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Button onClick={() => window.api.openExplorer(folder)} variant="primary">Открыть папку</Button>
          <Button onClick={onRestart} variant="outline">Другой профиль</Button>
        </div>
      </div>
    </div>
  )
}
