import { describe, it, expect, vi } from 'vitest'
import { buildOszFilename, shouldSkip, runDownloadQueue } from '../src/main/downloader.js'

describe('buildOszFilename', () => {
  it('formats filename correctly', () => {
    const name = buildOszFilename(123456, 'Camellia', 'Ghost')
    expect(name).toBe('123456 Camellia - Ghost.osz')
  })

  it('sanitizes special characters', () => {
    const name = buildOszFilename(1, 'Art/ist', 'Ti:tle')
    expect(name).toBe('1 Art_ist - Ti_tle.osz')
  })
})

describe('shouldSkip', () => {
  it('returns true when beatmapset id exists in set', () => {
    const existing = new Set(['123456 Camellia - Ghost.osz', '999 x - y.osz'])
    expect(shouldSkip(123456, existing)).toBe(true)
  })

  it('returns false when beatmapset not in existing', () => {
    const existing = new Set(['999 x - y.osz'])
    expect(shouldSkip(123456, existing)).toBe(false)
  })
})

describe('runDownloadQueue — parallel worker pool', () => {
  it('returns correct counts for downloaded and failed beatmaps', async () => {
    const mockDownload = vi.fn()
      .mockResolvedValueOnce({ status: 'downloaded', filename: '1 A - B.osz' })
      .mockResolvedValueOnce({ status: 'failed', filename: '2 C - D.osz' })
      .mockResolvedValueOnce({ status: 'downloaded', filename: '3 E - F.osz' })

    const beatmaps = [
      { beatmapset_id: 1, beatmapset: { artist: 'A', title: 'B' } },
      { beatmapset_id: 2, beatmapset: { artist: 'C', title: 'D' } },
      { beatmapset_id: 3, beatmapset: { artist: 'E', title: 'F' } },
    ]

    const results = await runDownloadQueue({
      beatmaps,
      folder: '/fake',
      onProgress: () => {},
      _downloadFn: mockDownload
    })

    expect(results.downloaded).toBe(2)
    expect(results.failed).toBe(1)
    expect(results.skipped).toBe(0)
    expect(mockDownload).toHaveBeenCalledTimes(3)
  })

  it('fires onProgress once per beatmap', async () => {
    const mockDownload = vi.fn().mockResolvedValue({ status: 'downloaded', filename: 'x.osz' })
    const progressEvents = []

    const beatmaps = Array.from({ length: 5 }, (_, i) => ({
      beatmapset_id: i + 1,
      beatmapset: { artist: 'A', title: 'B' }
    }))

    await runDownloadQueue({
      beatmaps,
      folder: '/fake',
      onProgress: (e) => progressEvents.push(e),
      _downloadFn: mockDownload
    })

    expect(progressEvents).toHaveLength(5)
    expect(mockDownload).toHaveBeenCalledTimes(5)
  })

  it('stops early when signal is aborted', async () => {
    const controller = new AbortController()
    const mockDownload = vi.fn(async () => {
      controller.abort()
      return { status: 'downloaded', filename: 'x.osz' }
    })

    const beatmaps = Array.from({ length: 20 }, (_, i) => ({
      beatmapset_id: i + 1,
      beatmapset: { artist: 'A', title: 'B' }
    }))

    const results = await runDownloadQueue({
      beatmaps,
      folder: '/fake',
      onProgress: () => {},
      signal: controller.signal,
      _downloadFn: mockDownload
    })

    // Workers abort after first download, so far fewer than 20 complete
    expect(results.downloaded + results.skipped + results.failed).toBeLessThan(20)
  })

  it('skips beatmaps that already exist and does not call download', async () => {
    const mockDownload = vi.fn().mockResolvedValue({ status: 'downloaded', filename: '2 C - D.osz' })

    const beatmaps = [
      { beatmapset_id: 1, beatmapset: { artist: 'A', title: 'B' } },  // pre-existing, should be skipped
      { beatmapset_id: 2, beatmapset: { artist: 'C', title: 'D' } },  // new, should be downloaded
    ]

    const results = await runDownloadQueue({
      beatmaps,
      folder: '/fake',
      onProgress: () => {},
      _downloadFn: mockDownload,
      _existingFiles: new Set(['1 A - B.osz'])  // beatmapset 1 already exists
    })

    expect(results.skipped).toBe(1)
    expect(results.downloaded).toBe(1)
    expect(mockDownload).toHaveBeenCalledTimes(1)
  })
})
