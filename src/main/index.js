import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { registerIpcHandlers } from './ipc.js'

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    resizable: false,
    frame: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  registerIpcHandlers(win)

  win.webContents.on('before-input-event', (_, input) => {
    if (input.key === 'F12') win.webContents.openDevTools({ mode: 'detach' })
  })

  if (process.env.NODE_ENV === 'development') {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
})
app.on('window-all-closed', () => app.quit())
