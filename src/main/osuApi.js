const API_BASE = 'https://osu.ppy.sh/api/v2'

export function buildMostPlayedUrl(userId, offset) {
  return `${API_BASE}/users/${userId}/beatmapsets/most_played?limit=50&offset=${offset}`
}

export function sanitizeFilename(name) {
  return name
    .trim()
    .replace(/[<>:"/\\|?*]/g, '_')
    .slice(0, 200)
}

export async function fetchUser(usernameOrId, accessToken) {
  const response = await fetch(`${API_BASE}/users/${encodeURIComponent(usernameOrId)}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  })

  if (response.status === 404) throw new Error('USER_NOT_FOUND')
  if (!response.ok) throw new Error(`API error: ${response.status}`)

  return response.json()
}

export async function fetchAllMostPlayed(userId, accessToken, onProgress) {
  const all = []
  let offset = 0

  while (true) {
    const url = buildMostPlayedUrl(userId, offset)
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) throw new Error(`API error: ${response.status}`)

    const page = await response.json()
    if (!page || page.length === 0) break

    all.push(...page)
    offset += page.length

    if (onProgress) onProgress(all.length)

    await new Promise(r => setTimeout(r, 200))
  }

  return all
}
