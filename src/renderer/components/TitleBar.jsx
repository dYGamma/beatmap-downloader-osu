import { useState } from 'react'

export default function TitleBar() {
  return (
    <div style={{
      height: 32,
      background: '#1A1A2E',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingLeft: 16,
      paddingRight: 12,
      WebkitAppRegion: 'drag',
      flexShrink: 0,
      borderBottom: '1px solid rgba(255,255,255,0.06)'
    }}>
      <span style={{ color: 'rgba(250,246,233,0.7)', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em' }}>
        osu! BEATMAP DOWNLOADER
      </span>
      <div style={{ display: 'flex', gap: 8, WebkitAppRegion: 'no-drag' }}>
        <MacBtn onClick={() => window.api.minimize()} color="#FEBC2E" aria-label="Minimize" />
        <MacBtn onClick={() => window.api.close()} color="#FF6B6B" aria-label="Close" />
      </div>
    </div>
  )
}

function MacBtn({ onClick, color, 'aria-label': ariaLabel }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={ariaLabel}
      style={{
        width: 12,
        height: 12,
        borderRadius: '50%',
        background: color,
        border: '1.5px solid rgba(0,0,0,0.25)',
        cursor: 'pointer',
        padding: 0,
        transition: 'filter 0.12s ease',
        filter: hovered ? 'brightness(1.2)' : 'none'
      }}
    />
  )
}
