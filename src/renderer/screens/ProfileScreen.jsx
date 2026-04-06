import { useState } from 'react'
import Button from '../components/Button'

export default function ProfileScreen({ onStart, onLogout }) {
  const [username, setUsername] = useState('')
  const [folder, setFolder] = useState('')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetchingMaps, setFetchingMaps] = useState(false)
  const [mapCount, setMapCount] = useState(null)
  const [error, setError] = useState(null)

  async function handleLookup() {
    if (!username.trim()) return
    setError(null)
    setLoading(true)
    setUser(null)
    setMapCount(null)
    try {
      const userData = await window.api.getUser(username.trim())
      setUser(userData)
    } catch (err) {
      setError(err.message === 'USER_NOT_FOUND' ? 'Пользователь не найден' : 'Ошибка: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handlePickFolder() {
    const picked = await window.api.openFolder()
    if (picked) setFolder(picked)
  }

  async function handleStart() {
    if (!user || !folder) return
    setError(null)
    setFetchingMaps(true)
    window.api.onFetchProgress((count) => setMapCount(count))
    try {
      const beatmaps = await window.api.fetchMostPlayed(user.id)
      window.api.removeAllListeners('osu:fetchProgress')
      onStart({ user, beatmaps, folder })
    } catch (err) {
      setError('Ошибка загрузки списка: ' + err.message)
      setFetchingMaps(false)
    }
  }

  return (
    <div className="screen" style={{ justifyContent: 'center', maxWidth: 600, margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <p style={{ fontSize: 11, letterSpacing: '0.1em', color: 'var(--accent)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
            Шаг 1
          </p>
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>Выбери профиль</h2>
        </div>
        <button
          onClick={onLogout}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline', marginTop: 4 }}
        >
          Выйти
        </button>
      </div>

      {/* Search row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input
          placeholder="Username или ID профиля (например: 10874153)"
          value={username}
          onChange={e => setUsername(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLookup()}
          style={{ flex: 1 }}
        />
        <Button onClick={handleLookup} variant="primary" disabled={loading || !username.trim()}>
          {loading ? '...' : 'Найти'}
        </Button>
      </div>

      {/* Found user panel */}
      {user && (
        <div
          className="fade-slide-up"
          style={{
            background: 'var(--subtle)',
            borderRadius: 10,
            padding: '14px 18px',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 16
          }}
        >
          <img src={user.avatar_url} alt="" style={{ width: 52, height: 52, borderRadius: '50%', border: '2px solid var(--navy)' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 17 }}>{user.username}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>
              #{user.statistics?.global_rank?.toLocaleString() ?? '—'} · {user.country_code}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Сыграно карт</div>
            <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--accent)' }}>
              {user.beatmap_playcounts_count?.toLocaleString() ?? '—'}
            </div>
          </div>
        </div>
      )}

      <hr className="divider" />

      {/* Folder row */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 11, letterSpacing: '0.1em', color: 'var(--accent)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>
          Шаг 2 — Папка для сохранения
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            readOnly
            value={folder || ''}
            placeholder="Нажми «Обзор» для выбора папки..."
            style={{ flex: 1, cursor: 'default' }}
          />
          <Button onClick={handlePickFolder} variant="outline">Обзор</Button>
        </div>
      </div>

      {error && <p style={{ color: 'var(--accent)', fontSize: 13, marginBottom: 16 }}>{error}</p>}

      {fetchingMaps && (
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
          Загружаю список карт...{mapCount !== null ? ` (${mapCount} загружено)` : ''}
        </p>
      )}

      <Button
        onClick={handleStart}
        variant="accent"
        disabled={!user || !folder || fetchingMaps}
        style={{ width: '100%', padding: '14px 28px' }}
      >
        {fetchingMaps ? `Получаю список${mapCount ? ` (${mapCount})` : ''}...` : 'Начать загрузку'}
      </Button>
    </div>
  )
}
