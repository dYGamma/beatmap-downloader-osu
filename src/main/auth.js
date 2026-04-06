import { shell } from 'electron'
import { createServer } from 'http'
import { URL } from 'url'
import { getConfig, saveTokens, getTokens } from './store.js'

const REDIRECT_URI = 'http://localhost:8080/callback'
const OSU_AUTHORIZE = 'https://osu.ppy.sh/oauth/authorize'
const OSU_TOKEN = 'https://osu.ppy.sh/oauth/token'

export async function startOAuth() {
  const { clientId } = getConfig()
  if (!clientId) throw new Error('NO_CONFIG')

  const authUrl = `${OSU_AUTHORIZE}?client_id=${clientId}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=public+identify`

  return waitForCallback(authUrl)
}

function waitForCallback(authUrl) {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url, 'http://localhost:8080')
      if (url.pathname !== '/callback') {
        res.writeHead(404)
        res.end()
        return
      }

      const code = url.searchParams.get('code')
      const error = url.searchParams.get('error')

      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(`<html><body style="font-family:sans-serif;padding:40px;background:#FAF6E9">
        <h2 style="color:#1A1A2E">${error ? 'Ошибка авторизации' : '✓ Успешно!'}</h2>
        <p style="color:#6B6B8A">${error ? error : 'Можешь закрыть эту вкладку и вернуться в приложение.'}</p>
        <script>setTimeout(() => window.close(), 2000)</script>
      </body></html>`)

      server.close()
      if (error) reject(new Error(error))
      else resolve(code)
    })

    server.on('error', reject)

    // Server starts listening, THEN browser opens
    server.listen(8080, 'localhost', () => {
      shell.openExternal(authUrl).catch(reject)
    })

    // Timeout after 5 minutes
    setTimeout(() => {
      server.close()
      reject(new Error('OAuth timeout'))
    }, 5 * 60 * 1000)
  })
}

export async function exchangeCode(code) {
  const { clientId, clientSecret } = getConfig()

  const response = await fetch(OSU_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI
    })
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Token exchange failed: ${response.status} ${text}`)
  }

  const tokens = await response.json()
  const expiresAt = Date.now() + tokens.expires_in * 1000
  saveTokens({ ...tokens, expires_at: expiresAt })
  return tokens
}

export async function refreshAccessToken() {
  const tokens = getTokens()
  if (!tokens?.refresh_token) throw new Error('NO_REFRESH_TOKEN')

  const { clientId, clientSecret } = getConfig()

  const response = await fetch(OSU_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: tokens.refresh_token,
      grant_type: 'refresh_token'
    })
  })

  if (!response.ok) throw new Error(`Refresh failed: ${response.status}`)

  const newTokens = await response.json()
  const expiresAt = Date.now() + newTokens.expires_in * 1000
  saveTokens({ ...newTokens, expires_at: expiresAt })
  return newTokens
}

export async function getValidAccessToken() {
  let tokens = getTokens()
  if (!tokens) throw new Error('NOT_LOGGED_IN')

  // Refresh if expires within 60 seconds
  if (tokens.expires_at - Date.now() < 60_000) {
    tokens = await refreshAccessToken()
  }

  return tokens.access_token
}
