import type { DiffFileOrder } from './diff-files'

export type DiffViewSettings = {
  fileOrder: DiffFileOrder | 'tree'
  diffStyle: 'unified' | 'split'
  wrapLines: boolean
}

export const VIEW_SETTINGS_STORAGE_KEY = 'diffdump.view-settings.v1'

const DEFAULT_VIEW_SETTINGS: DiffViewSettings = {
  fileOrder: 'tree',
  diffStyle: 'unified',
  wrapLines: false,
}

export function readStoredViewSettings(): DiffViewSettings {
  try {
    const stored = globalThis.localStorage?.getItem(VIEW_SETTINGS_STORAGE_KEY)
    const parsed: unknown = stored ? JSON.parse(stored) : null

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return { ...DEFAULT_VIEW_SETTINGS }
    }

    return {
      fileOrder:
        'fileOrder' in parsed &&
        (parsed.fileOrder === 'tree' ||
          parsed.fileOrder === 'patch' ||
          parsed.fileOrder === 'category')
          ? parsed.fileOrder
          : DEFAULT_VIEW_SETTINGS.fileOrder,
      diffStyle:
        'diffStyle' in parsed &&
        (parsed.diffStyle === 'unified' || parsed.diffStyle === 'split')
          ? parsed.diffStyle
          : DEFAULT_VIEW_SETTINGS.diffStyle,
      wrapLines:
        'wrapLines' in parsed && typeof parsed.wrapLines === 'boolean'
          ? parsed.wrapLines
          : DEFAULT_VIEW_SETTINGS.wrapLines,
    }
  } catch {
    return { ...DEFAULT_VIEW_SETTINGS }
  }
}

export function writeStoredViewSettings(settings: DiffViewSettings): void {
  try {
    globalThis.localStorage?.setItem(
      VIEW_SETTINGS_STORAGE_KEY,
      JSON.stringify(settings),
    )
  } catch {
    // View controls still work when storage is unavailable or full.
  }
}
