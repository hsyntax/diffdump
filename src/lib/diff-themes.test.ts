import {
  disposeHighlighter,
  getResolvedOrResolveTheme,
  getSharedHighlighter,
} from '@pierre/diffs'
import { afterAll, describe, expect, it } from 'vitest'

import { diffThemes } from './diff-themes'
import lightTheme from './themes/pierre/pierre-light.json'
import darkTheme from './themes/pierre/pierre-dark.json'

afterAll(disposeHighlighter)

describe.each([
  ['light', lightTheme, '#d32a61', '#199f43', '#1ca1c7'],
  ['dark', darkTheme, '#ff678d', '#5ecc71', '#68cdf2'],
] as const)('Pierre %s theme', (mode, source, keyword, string, number) => {
  it('loads the full copied token rules without custom overrides', async () => {
    const resolved = await getResolvedOrResolveTheme(diffThemes[mode])

    expect(
      resolved.settings.filter((rule) => rule.scope !== undefined),
    ).toEqual(source.tokenColors)
    expect(resolved.colors?.['editor.background']).toBe(
      source.colors['editor.background'],
    )
    expect(resolved.colors?.['diffEditor.insertedTextBackground']).toBe(
      source.colors['diffEditor.insertedTextBackground'],
    )
  })

  it.each(['typescript', 'tsx'] as const)(
    'highlights %s using the copied Pierre palette',
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

      expect(rendered.bg).toBe(source.colors['editor.background'])
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
