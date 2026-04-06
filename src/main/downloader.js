import { writeFile, readdirSync } from 'fs'
import { join } from 'path'
import { promisify } from 'util'
import { sanitizeFilename } from './osuApi.js'

const writeFileAsync = promisify(writeFile)

const MAX_RETRIES = 3
const CONCURRENCY = 5
const STAGGER_MS = 80
const WORKER_DELAY_MS = 200

// Mirror sources — tried in order, no auth required
const MIRRORS = [
  (id) => `https://catboy.best/d/${id}`,
  (id) => `https://osu.direct/api/d/${id}`,
  (id) => `https://chimu.moe/d/${id}`
]

export function buildOszFilename(beatmapsetId, artist, title) {
  return `${beatmapsetId} ${sanitizeFilename(artist)} - ${sanitizeFilename(title)}.osz`
}

export function shouldSkip(beatmapsetId, existingFilenames) {
  for (const filename of existingFilenames) {
    if (filename.startsWith(`${beatmapsetId} `)) return true
  }
  return false
}

export function getExistingOszFiles(folder) {
  try {
    return new Set(readdirSync(folder).filter(f => f.endsWith('.osz')))
  } catch {
    return new Set()
  }
}

async function downloadFromUrl(url, destPath) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'osu-beatmap-downloader/1.0' },
    redirect: 'follow'
  })

  if (response.status === 404) throw new Error('NOT_FOUND')
  if (!response.ok) throw new Error(`HTTP_${response.status}`)

  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('text/html')) throw new Error('HTML_RESPONSE')

  // Use arrayBuffer — avoids Readable.fromWeb compatibility issues in packaged Electron
  const buffer = await response.arrayBuffer()
  if (buffer.byteLength < 100) throw new Error('EMPTY_RESPONSE')

  await writeFileAsync(destPath, Buffer.from(buffer))
}

async function downloadOne(beatmapsetId, destPath) {
  let lastError
  for (const getMirrorUrl of MIRRORS) {
    const url = getMirrorUrl(beatmapsetId)
    try {
      await downloadFromUrl(url, destPath)
      return
    } catch (err) {
      lastError = err
      if (err.message === 'NOT_FOUND') break
    }
  }
  throw lastError
}

export async function downloadBeatmapset({ beatmapsetId, artist, title, folder }) {
  const filename = buildOszFilename(beatmapsetId, artist, title)
  const destPath = join(folder, filename)

  let lastError
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await downloadOne(beatmapsetId, destPath)
      return { status: 'downloaded', filename }
    } catch (err) {
      lastError = err
      if (err.message === 'NOT_FOUND') break
      if (attempt < MAX_RETRIES) await new Promise(r => setTimeout(r, 1000 * attempt))
    }
  }

  return { status: 'failed', filename, error: lastError?.message }
}

export async function runDownloadQueue({ beatmaps, folder, onProgress, signal, _downloadFn = downloadBeatmapset, _existingFiles = null }) {
  const existing = _existingFiles ?? getExistingOszFiles(folder)
  const results = { downloaded: 0, skipped: 0, failed: 0 }

  let queueIndex = 0

  async function worker(workerId) {
    await new Promise(r => setTimeout(r, workerId * STAGGER_MS))

    while (true) {
      if (signal?.aborted) break

      const i = queueIndex++
      if (i >= beatmaps.length) break

      const { beatmapset_id, beatmapset } = beatmaps[i]
      const artist = beatmapset?.artist || 'Unknown'
      const title = beatmapset?.title || `beatmapset_${beatmapset_id}`

      if (shouldSkip(beatmapset_id, existing)) {
        results.skipped++
        onProgress({ index: i, total: beatmaps.length, status: 'skipped', artist, title, beatmapset_id, results: { ...results } })
        continue
      }

      const result = await _downloadFn({ beatmapsetId: beatmapset_id, artist, title, folder })

      if (result.status === 'downloaded') {
        existing.add(result.filename)
        results.downloaded++
      } else {
        results.failed++
      }

      onProgress({ index: i, total: beatmaps.length, status: result.status, artist, title, beatmapset_id, results: { ...results } })

      await new Promise(r => setTimeout(r, WORKER_DELAY_MS))
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => worker(i)))

  return results
}
