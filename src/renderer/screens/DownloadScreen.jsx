import { useEffect, useReducer, useRef } from 'react'
import Button from '../components/Button'
import ProgressBar from '../components/ProgressBar'

const STATUS_ICON = { pending: '○', downloading: '↓', downloaded: '✓', skipped: '⟳', failed: '✗' }
const STATUS_COLOR = { downloaded: '#4CAF50', skipped: '#888', failed: '#FF6B6B', downloading: 'var(--text)', pending: 'rgba(26,26,46,0.25)' }

function reducer(state, action) {
  switch (action.type) {
    case 'PROGRESS': {
      const { index, total, status, artist, title, beatmapset_id, results } = action.payload
      const tracks = [...state.tracks]
      tracks[index] = { beatmapset_id, artist, title, status }
      const completed = results.downloaded + results.skipped + results.failed
      return { ...state, tracks, current: completed, total, results }
    }
    default:
      return state
  }
}

export default function DownloadScreen({ beatmaps, folder, onDone }) {
  const [state, dispatch] = useReducer(reducer, {
    tracks: beatmaps.map(b => ({
      beatmapset_id: b.beatmapset_id,
      artist: b.artist || '?',
      title: b.title || '?',
      status: 'pending'
    })),
    current: 0,
    total: beatmaps.length,
    results: { downloaded: 0, skipped: 0, failed: 0 }
  })

  const listRef = useRef(null)

  useEffect(() => {
    window.api.onDownloadProgress((data) => {
      dispatch({ type: 'PROGRESS', payload: data })
      if (listRef.current) {
        const item = listRef.current.children[data.index]
        item?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    })

    window.api.onDownloadDone((results) => {
      onDone(results)
    })

    window.api.startDownload(folder)

    return () => {
      window.api.removeAllListeners('download:progress')
      window.api.removeAllListeners('download:done')
    }
  }, [])

  const { tracks, current, total, results } = state

  return (
    <div className="screen" style={{ paddingTop: 36, paddingBottom: 32, gap: 0 }}>
      {/* Header + progress */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800 }}>Загрузка карт</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>
              {current} из {total} завершено
            </p>
          </div>
          <Button onClick={() => window.api.stopDownload()} variant="outline" style={{ padding: '6px 16px', fontSize: 12 }}>
            Стоп
          </Button>
        </div>
        <ProgressBar value={current} max={total} />
        <div style={{ display: 'flex', gap: 24, marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
          <span style={{ color: STATUS_COLOR.downloaded }}>✓ {results.downloaded} скачано</span>
          <span style={{ color: STATUS_COLOR.skipped }}>⟳ {results.skipped} пропущено</span>
          <span style={{ color: STATUS_COLOR.failed }}>✗ {results.failed} ошибок</span>
        </div>
      </div>

      {/* Divider */}
      <hr className="divider" style={{ marginTop: 4, marginBottom: 12 }} />

      {/* Track list */}
      <div
        ref={listRef}
        style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        {tracks.map((track, i) => {
          const isActive = track.status === 'downloading'
          return (
            <div
              key={track.beatmapset_id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '5px 8px',
                borderRadius: 6,
                background: isActive ? 'var(--subtle)' : 'transparent',
                fontSize: 13,
                transition: 'background 0.2s ease'
              }}
            >
              <span
                className={isActive ? 'pulse-icon' : ''}
                style={{ width: 14, color: STATUS_COLOR[track.status] || 'rgba(26,26,46,0.25)', flexShrink: 0, fontSize: 12 }}
              >
                {STATUS_ICON[track.status] || '○'}
              </span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: track.status === 'pending' ? 'var(--text-muted)' : 'var(--text)' }}>
                {track.artist} — {track.title}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: 11, flexShrink: 0 }}>
                #{track.beatmapset_id}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
