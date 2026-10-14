import { describe, expect, it, vi } from 'vitest'

import { loadDiff } from '../lib/diffs.server'
import { handleDiffDownload } from './diff-download'

const SLUG = 'AAECAwQFBgcICQoL'
const CREATED_AT = '2026-10-14T12:00:00.000Z'
const EXPIRES_AT = '2026-10-15T12:00:00.000Z'
const DIFF =
  'diff --git a/hello.ts b/hello.ts\r\n--- a/hello.ts\r\n+++ b/hello.ts\r\n@@ -1 +1 @@\r\n-hello\r\n+hello 🌎'

type LoadSharedDiff = Parameters<typeof handleDiffDownload>[1]
type DiffBucket = Parameters<typeof loadDiff>[0]
type MockR2Get = (key: string) => Promise<unknown>

describe('GET /d/:slug', () => {
  it('downloads the original stored patch without changing its bytes', async () => {
    const { bucket, get } = createBucket()

    const response = await handleDiffDownload(SLUG, (slug) =>
      loadDiff(bucket, slug, {
        now: () => new Date(CREATED_AT),
      }),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe(
      'text/x-diff; charset=utf-8',
    )
    expect(response.headers.get('Content-Disposition')).toBe(
      `attachment; filename="diffdump-${SLUG}.diff"`,
    )
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(
      new TextEncoder().encode(DIFF),
    )
    expect(get).toHaveBeenCalledWith(`diffs/${SLUG}`)
  })

  it.each([
    {
      now: '2026-10-15T11:59:59.999Z',
      status: 200,
      body: DIFF,
      reads: 1,
    },
    {
      now: EXPIRES_AT,
      status: 404,
      body: 'This diff is missing or has expired.\n',
      reads: 0,
    },
    {
      now: '2026-10-15T12:00:00.001Z',
      status: 404,
      body: 'This diff is missing or has expired.\n',
      reads: 0,
    },
  ])(
    'checks expiry at download time ($now)',
    async ({ now, status, body, reads }) => {
      const { bucket, text } = createBucket()

      const response = await handleDiffDownload(SLUG, (slug) =>
        loadDiff(bucket, slug, { now: () => new Date(now) }),
      )

      expect(response.status).toBe(status)
      expect(response.headers.get('Cache-Control')).toBe('no-store')
      await expect(response.text()).resolves.toBe(body)
      expect(text).toHaveBeenCalledTimes(reads)
    },
  )

  it('keeps the one-day expiry for legacy shares without expiry metadata', async () => {
    const { bucket, text } = createBucket({ createdAt: CREATED_AT })

    const response = await handleDiffDownload(SLUG, (slug) =>
      loadDiff(bucket, slug, { now: () => new Date(EXPIRES_AT) }),
    )

    expect(response.status).toBe(404)
    expect(text).not.toHaveBeenCalled()
  })

  it('returns 404 for missing objects', async () => {
    const bucket = {
      get: vi.fn<MockR2Get>().mockResolvedValue(null),
    } as unknown as DiffBucket

    const response = await handleDiffDownload(SLUG, (slug) =>
      loadDiff(bucket, slug),
    )

    expect(response.status).toBe(404)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(response.headers.get('Content-Disposition')).toBeNull()
  })

  it.each(['short', '../AAECAwQFBgcICQoL', 'AAECAwQFBgcICQo"'])(
    'rejects invalid slugs before reading storage (%s)',
    async (slug) => {
      const loadSharedDiff = vi.fn<LoadSharedDiff>()

      const response = await handleDiffDownload(slug, loadSharedDiff)

      expect(response.status).toBe(404)
      expect(response.headers.get('Cache-Control')).toBe('no-store')
      expect(loadSharedDiff).not.toHaveBeenCalled()
    },
  )

  it('returns an uncached error without exposing storage details', async () => {
    const response = await handleDiffDownload(SLUG, async () => {
      throw new Error('sensitive storage detail')
    })

    expect(response.status).toBe(500)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(response.headers.get('Content-Disposition')).toBeNull()
    await expect(response.text()).resolves.toBe(
      'The diff could not be downloaded. Please try again.\n',
    )
  })
})

function createBucket(
  customMetadata: Record<string, string> = {
    createdAt: CREATED_AT,
    expiresAt: EXPIRES_AT,
  },
) {
  const text = vi.fn<() => Promise<string>>().mockResolvedValue(DIFF)
  const get = vi.fn<MockR2Get>().mockResolvedValue({
    customMetadata,
    uploaded: new Date(CREATED_AT),
    text,
  })

  return { bucket: { get } as unknown as DiffBucket, get, text }
}
