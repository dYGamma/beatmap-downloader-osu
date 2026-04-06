import { app, safeStorage } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'

const configPath = join(app.getPath('userData'), 'config.json')
const tokensPath = join(app.getPath('userData'), 'tokens.json')

function readJSON(filePath) {
  if (!existsSync(filePath)) return {}
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8'))
  } catch {
    return {}
  }
}

function writeJSON(filePath, data) {
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

// Config: client_id, client_secret (plaintext)
export function getConfig() {
  return readJSON(configPath)
}

export function saveConfig(config) {
  writeJSON(configPath, config)
}

// Tokens: access_token, refresh_token (encrypted via safeStorage)
export function getTokens() {
  const raw = readJSON(tokensPath)
  if (!raw.encrypted) return null
  if (!safeStorage.isEncryptionAvailable()) return null
  try {
    const buf = Buffer.from(raw.encrypted, 'base64')
    const decrypted = safeStorage.decryptString(buf)
    return JSON.parse(decrypted)
  } catch {
    return null
  }
}

export function saveTokens(tokens) {
  if (!safeStorage.isEncryptionAvailable()) return
  const encrypted = safeStorage.encryptString(JSON.stringify(tokens))
  writeJSON(tokensPath, { encrypted: encrypted.toString('base64') })
}

export function clearTokens() {
  writeJSON(tokensPath, {})
}
