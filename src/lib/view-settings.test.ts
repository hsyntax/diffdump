import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  readStoredViewSettings,
  VIEW_SETTINGS_STORAGE_KEY,
  writeStoredViewSettings,
} from './view-settings'

const defaults = { fileOrder: 'tree', diffStyle: 'unified', wrapLines: false }

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('view settings storage', () => {
  it('restores all preferences on a fresh read and saves later changes', () => {
    const values = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    })

    expect(readStoredViewSettings()).toEqual(defaults)
    writeStoredViewSettings({
      fileOrder: 'category',
      diffStyle: 'split',
      wrapLines: true,
    })
    expect(readStoredViewSettings()).toEqual({
      fileOrder: 'category',
      diffStyle: 'split',
      wrapLines: true,
    })

    writeStoredViewSettings({ ...readStoredViewSettings(), fileOrder: 'patch' })
    expect(readStoredViewSettings()).toEqual({
      fileOrder: 'patch',
      diffStyle: 'split',
      wrapLines: true,
    })
    expect([...values.keys()]).toEqual([VIEW_SETTINGS_STORAGE_KEY])
  })

  it.each(['not json', 'null', '[]', '42', '"split"'])(
    'falls back to defaults for malformed data: %s',
    (stored) => {
      vi.stubGlobal('localStorage', { getItem: () => stored })
      expect(readStoredViewSettings()).toEqual(defaults)
    },
  )

  it('defaults invalid or missing fields while preserving valid preferences', () => {
    vi.stubGlobal('localStorage', {
      getItem: () =>
        JSON.stringify({
          fileOrder: 'unknown',
          diffStyle: 'split',
          wrapLines: 'false',
        }),
    })
    expect(readStoredViewSettings()).toEqual({
      ...defaults,
      diffStyle: 'split',
    })

    vi.stubGlobal('localStorage', {
      getItem: () => JSON.stringify({ wrapLines: true }),
    })
    expect(readStoredViewSettings()).toEqual({ ...defaults, wrapLines: true })
  })

  it('keeps the viewer usable without storage or when storage throws', () => {
    vi.stubGlobal('localStorage', undefined)
    expect(readStoredViewSettings()).toEqual(defaults)
    expect(() =>
      writeStoredViewSettings(readStoredViewSettings()),
    ).not.toThrow()

    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('full')
      },
    })
    expect(readStoredViewSettings()).toEqual(defaults)
    expect(() =>
      writeStoredViewSettings(readStoredViewSettings()),
    ).not.toThrow()
  })
})
