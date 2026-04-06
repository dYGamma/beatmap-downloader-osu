import { useState } from 'react'
import Button from '../components/Button'

export default function LoginScreen({ onLoggedIn }) {
  const [showSetup, setShowSetup] = useState(false)
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleLogin() {
    setError(null)
    setLoading(true)
    try {
      const config = await window.api.getConfig()
      if (!config.clientId || !config.clientSecret) {
        setShowSetup(true)
        setLoading(false)
        return
      }
      await window.api.login()
      onLoggedIn()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveConfig() {
    if (!clientId.trim() || !clientSecret.trim()) {
      setError('Оба поля обязательны')
      return
    }
    await window.api.saveConfig({ clientId: clientId.trim(), clientSecret: clientSecret.trim() })
    setShowSetup(false)
    setError(null)
  }

  if (showSetup) {
    return (
      <div className="screen screen-centered">
        <div style={{ width: 480 }}>
          <p style={{ fontSize: 11, letterSpacing: '0.1em', color: 'var(--accent)', marginBottom: 10, textTransform: 'uppercase', fontWeight: 700 }}>
            Первоначальная настройка
          </p>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>OAuth приложение</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24, lineHeight: 1.7 }}>
            1. Открой <strong>osu.ppy.sh/home/account/edit</strong><br />
            2. Прокрути до раздела <strong>OAuth</strong><br />
            3. Нажми <strong>New OAuth Application</strong><br />
            4. Callback URL: <code style={{ background: 'var(--subtle)', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>http://localhost:8080/callback</code><br />
            5. Скопируй Client ID и Client Secret сюда
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            <input placeholder="Client ID" value={clientId} onChange={e => setClientId(e.target.value)} />
            <input type="password" placeholder="Client Secret" value={clientSecret} onChange={e => setClientSecret(e.target.value)} />
          </div>
          {error && <p style={{ color: 'var(--accent)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 12 }}>
            <Button onClick={handleSaveConfig} variant="primary">Сохранить</Button>
            <Button onClick={() => setShowSetup(false)} variant="outline">Назад</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="screen screen-centered">
      <div style={{ width: 400, textAlign: 'center' }}>
        <div
          className="logo-bounce"
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #FF6B6B, #FF99BB)',
            border: '3px solid var(--navy)',
            margin: '0 auto 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 36,
            color: '#FAF6E9',
            fontWeight: 800,
            boxShadow: '0 4px 24px rgba(255,107,107,0.35)'
          }}
        >
          ●
        </div>
        <p style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--accent)', marginBottom: 10, textTransform: 'uppercase', fontWeight: 700 }}>
          osu! beatmap downloader
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12, lineHeight: 1.2 }}>
          Восстанови свои карты
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 36, lineHeight: 1.7 }}>
          Скачай все карты из вкладки «Больше всего сыграно»<br />любого профиля за один клик.
        </p>
        {error && <p style={{ color: 'var(--accent)', fontSize: 13, marginBottom: 16 }}>{error}</p>}
        <Button onClick={handleLogin} variant="accent" disabled={loading} style={{ width: '100%', marginBottom: 16, padding: '14px 28px' }}>
          {loading ? 'Подождите...' : 'Войти через osu!'}
        </Button>
        <button
          onClick={() => setShowSetup(true)}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}
        >
          Как создать OAuth приложение?
        </button>
      </div>
    </div>
  )
}
