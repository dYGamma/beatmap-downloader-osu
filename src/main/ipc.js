import { ipcMain, dialog, shell } from 'electron'
import { getConfig, saveConfig, getTokens, clearTokens } from './store.js'
import { startOAuth, exchangeCode, getValidAccessToken } from './auth.js'
import { fetchUser, fetchAllMostPlayed } from './osuApi.js'
import { runDownloadQueue } from './downloader.js'

let downloadAbortController = null
let cachedBeatmaps = []

export function registerIpcHandlers(win) {
  ipcMain.on('window:minimize', () => win.minimize())
  ipcMain.on('window:close', () => win.close())

  ipcMain.handle('config:get', () => getConfig())
  ipcMain.handle('config:save', (_, config) => { saveConfig(config); return true })

  ipcMain.handle('auth:status', () => {
    const tokens = getTokens()
    return { loggedIn: !!tokens }
  })

  ipcMain.handle('auth:login', async () => {
    const code = await startOAuth()
    await exchangeCode(code)
    return { success: true }
  })

  ipcMain.handle('auth:logout', () => {
    clearTokens()
    return true
  })

  ipcMain.handle('osu:getUser', async (_, usernameOrId) => {
    const token = await getValidAccessToken()
    return fetchUser(usernameOrId, token)
  })

  ipcMain.handle('osu:fetchMostPlayed', async (_, userId) => {
    const token = await getValidAccessToken()
    const raw = await fetchAllMostPlayed(userId, token, (count) => {
      if (!win.isDestroyed()) win.webContents.send('osu:fetchProgress', count)
    })

    const normalized = raw.map(b => ({
      beatmapset_id: b.beatmapset_id ?? b.beatmap?.beatmapset_id ?? b.beatmapset?.id,
      beatmapset: b.beatmapset,
      beatmap: b.beatmap
    }))

    const seen = new Set()
    cachedBeatmaps = normalized.filter(b => {
      if (!b.beatmapset_id || seen.has(b.beatmapset_id)) return false
      seen.add(b.beatmapset_id)
      return true
    })

    return cachedBeatmaps.map(b => ({
      beatmapset_id: b.beatmapset_id,
      artist: b.beatmapset?.artist || 'Unknown',
      title: b.beatmapset?.title || `beatmapset_${b.beatmapset_id}`
    }))
  })

  ipcMain.handle('dialog:openFolder', async () => {
    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory'],
      title: 'Выбери папку для сохранения карт'
    })
    if (result.canceled) return null
    return result.filePaths[0]
  })

  ipcMain.on('dialog:openExplorer', (_, folderPath) => {
    shell.openPath(folderPath)
  })

  ipcMain.handle('download:start', async (_, { folder }) => {
    downloadAbortController = new AbortController()

    if (!cachedBeatmaps.length) {
      return { downloaded: 0, skipped: 0, failed: 0, fatalError: 'No beatmaps loaded' }
    }

    try {
      const results = await runDownloadQueue({
        beatmaps: cachedBeatmaps,
        folder,
        signal: downloadAbortController.signal,
        onProgress: (progress) => {
          if (!win.isDestroyed()) win.webContents.send('download:progress', progress)
        }
      })
      if (!win.isDestroyed()) win.webContents.send('download:done', results)
      return results
    } catch (err) {
      const errResults = { downloaded: 0, skipped: 0, failed: 0, fatalError: err.message }
      if (!win.isDestroyed()) win.webContents.send('download:done', errResults)
      return errResults
    }
  })

  ipcMain.on('download:stop', () => {
    downloadAbortController?.abort()
  })
}
