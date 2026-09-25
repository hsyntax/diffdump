import {
  disposeHighlighter,
  getResolvedOrResolveTheme,
  getSharedHighlighter,
} from '@pierre/diffs'
import { afterAll, describe, expect, it } from 'vitest'

import { diffPalettes, diffThemes, recolorTheme } from './diff-themes'
import lightTheme from './themes/pierre/pierre-light.json'
import darkTheme from './themes/pierre/pierre-dark.json'

afterAll(disposeHighlighter)

function colorsIn(value: unknown): string[] {
  if (typeof value === 'string') {
    return /^#[\da-f]{3,8}$/i.test(value) ? [value.toLowerCase()] : []
  }
  if (Array.isArray(value)) {
    return value.flatMap(colorsIn)
  }
  if (value !== null && typeof value === 'object') {
    return Object.values(value).flatMap(colorsIn)
  }
  return []
}

describe.each([
  ['light', lightTheme, '#b4532f', '#4d7c2a', '#986801'],
  ['dark', darkTheme, '#e0866a', '#a6c486', '#e0b36b'],
] as const)('diffdump %s theme', (mode, source, keyword, string, number) => {
  const palette = diffPalettes[mode]

  it('maps every color in the copied Pierre theme', () => {
    const unmapped = colorsIn(source).filter(
      (color) => !(color.slice(0, 7) in palette.colors),
    )

    expect(unmapped).toEqual([])
  })

  it('keeps the copied token rules and only changes their colors', async () => {
    const resolved = await getResolvedOrResolveTheme(diffThemes[mode])
    const expected = recolorTheme(source, palette)

    expect(
      resolved.settings.filter((rule) => rule.scope !== undefined),
    ).toEqual(expected.tokenColors)
    expect(expected.tokenColors.map((rule) => rule.scope)).toEqual(
      source.tokenColors.map((rule) => rule.scope),
    )
    expect(resolved.colors?.['editor.background']).toBe(
      palette.colors[source.colors['editor.background']],
    )
    expect(resolved.colors?.['gitDecoration.addedResourceForeground']).toBe(
      mode === 'light' ? '#1a8633' : '#32d74b',
    )
  })

  it.each(['typescript', 'tsx'] as const)(
    'highlights %s with the warm palette',
    async (lang) => {
      const highlighter = await getSharedHighlighter({
        themes: [diffThemes[mode]],
        langs: [lang],
      })
      const rendered = highlighter.codeToTokens(
        'export const greeting = "hello"; const count = 42;',
        { lang, theme: diffThemes[mode] },
      )
      const tokens = rendered.tokens.flat()

      expect(rendered.bg).toBe(
        palette.colors[source.colors['editor.background']],
      )
      expect(
        tokens
          .find((token) => token.content === 'export')
          ?.color?.toLowerCase(),
      ).toBe(keyword)
      expect(
        tokens
          .find((token) => token.content.includes('hello'))
          ?.color?.toLowerCase(),
      ).toBe(string)
      expect(
        tokens.find((token) => token.content === '42')?.color?.toLowerCase(),
      ).toBe(number)
    },
  )
})
