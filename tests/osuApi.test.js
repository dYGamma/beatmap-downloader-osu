import { describe, it, expect } from 'vitest'
import { buildMostPlayedUrl, sanitizeFilename } from '../src/main/osuApi.js'

describe('buildMostPlayedUrl', () => {
  it('builds URL with offset 0', () => {
    const url = buildMostPlayedUrl(12345, 0)
    expect(url).toBe('https://osu.ppy.sh/api/v2/users/12345/beatmapsets/most_played?limit=50&offset=0')
  })

  it('builds URL with non-zero offset', () => {
    const url = buildMostPlayedUrl(12345, 100)
    expect(url).toBe('https://osu.ppy.sh/api/v2/users/12345/beatmapsets/most_played?limit=50&offset=100')
  })
})

describe('sanitizeFilename', () => {
  it('removes characters invalid in Windows filenames', () => {
    expect(sanitizeFilename('Song: A/B\\C?')).toBe('Song_ A_B_C_')
  })

  it('trims whitespace', () => {
    expect(sanitizeFilename('  hello  ')).toBe('hello')
  })

  it('truncates at 200 chars', () => {
    const long = 'a'.repeat(250)
    expect(sanitizeFilename(long).length).toBe(200)
  })
})
