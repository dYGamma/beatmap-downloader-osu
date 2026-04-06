import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  // Window
  minimize: () => ipcRenderer.send('window:minimize'),
  close: () => ipcRenderer.send('window:close'),

  // Config
  getConfig: () => ipcRenderer.invoke('config:get'),
  saveConfig: (config) => ipcRenderer.invoke('config:save', config),

  // Auth
  authStatus: () => ipcRenderer.invoke('auth:status'),
  login: () => ipcRenderer.invoke('auth:login'),
  logout: () => ipcRenderer.invoke('auth:logout'),

  // osu! API
  getUser: (usernameOrId) => ipcRenderer.invoke('osu:getUser', usernameOrId),
  fetchMostPlayed: (userId) => ipcRenderer.invoke('osu:fetchMostPlayed', userId),
  onFetchProgress: (cb) => ipcRenderer.on('osu:fetchProgress', (_, count) => cb(count)),

  // Folder
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  openExplorer: (folder) => ipcRenderer.send('dialog:openExplorer', folder),

  // Downloads
  startDownload: (folder) => ipcRenderer.invoke('download:start', { folder }),
  stopDownload: () => ipcRenderer.send('download:stop'),
  onDownloadProgress: (cb) => ipcRenderer.on('download:progress', (_, data) => cb(data)),
  onDownloadDone: (cb) => ipcRenderer.on('download:done', (_, data) => cb(data)),

  // Cleanup listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
})
