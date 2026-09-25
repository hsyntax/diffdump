import { registerCustomTheme } from '@pierre/diffs'

// Warm variants of the copied Pierre themes. The vendored JSON stays
// unmodified; its colors are remapped onto diffdump's palette when a theme
// first loads, keeping every token rule intact.
export const diffThemes = {
  light: 'diffdump-light',
  dark: 'diffdump-dark',
} as const

type ThemeMode = keyof typeof diffThemes

type DiffPalette = {
  /** Pierre color (`#rrggbb`) to its replacement. Alpha suffixes carry over. */
  colors: Readonly<Record<string, string>>
  /** Editor colors whose Pierre value is shared with an unrelated role. */
  overrides: Readonly<Record<string, string>>
}

export const diffPalettes: Record<ThemeMode, DiffPalette> = {
  light: {
    colors: {
      '#ffffff': '#ffffff',
      '#0a0a0a': '#2c2c2a', // Code text
      '#d47628': '#2c2c2a', // Variables read as plain code text
      '#525252': '#52514e',
      '#636363': '#5e5d59', // Punctuation and parameters
      '#08c0ef': '#5e5d59', // Operators
      '#737373': '#73726c', // Comments
      '#8a8a8a': '#87867f',
      '#bcbcbc': '#c2c0b6',
      '#d4d4d4': '#c3c2b7',
      '#e5e5e5': '#e1e0d9',
      '#ededed': '#f0efec',
      '#f5f5f5': '#fcfcfb',
      '#f7f7f7': '#f9f9f7',
      '#1d1d1d': '#1f1e1d',
      '#d32a61': '#b4532f', // Keywords
      '#009fff': '#b4532f', // Cursor, focus, and selection accent
      '#1aa9ff': '#c6613f',
      '#dfebff': '#f8e7e1', // Selection
      '#199f43': '#4d7c2a', // Strings
      '#77a42a': '#4d7c2a',
      '#d5901c': '#986801', // Constants and namespaces
      '#1ca1c7': '#986801', // Numbers
      '#d5a910': '#986801',
      '#693acf': '#2566b8', // Functions
      '#1a85d4': '#2566b8', // Decorators
      '#a631be': '#6b4d9e', // Types
      '#d5512f': '#a64d87', // Tags and language variables
      '#bd2e90': '#a64d87',
      '#18a46c': '#26777a', // Attribute names
      '#17a5af': '#26777a', // Regular expressions
      '#16a994': '#26777a', // Escapes
      '#d52c36': '#cd2054', // Deletions
    },
    overrides: {
      'editorLineNumber.foreground': '#7a7975',
      'gitDecoration.addedResourceForeground': '#1a8633',
      'gitDecoration.untrackedResourceForeground': '#1a8633',
      'terminal.ansiGreen': '#1a8633',
      'diffEditor.insertedTextBackground': '#1a863333',
    },
  },
  dark: {
    colors: {
      '#0a0a0a': '#1a1a19', // Editor background
      '#101010': '#151515',
      '#171717': '#151515',
      '#1d1d1d': '#20201f',
      '#262626': '#2a2a28',
      '#fafafa': '#dedcd1', // Code text
      '#ffa359': '#dedcd1', // Variables read as plain code text
      '#a3a3a3': '#c3c2b7',
      '#bcbcbc': '#c3c2b7',
      '#636363': '#a5a49a', // Punctuation and parameters
      '#08c0ef': '#a5a49a', // Operators
      '#737373': '#8f8d86', // Comments
      '#ff678d': '#e0866a', // Keywords
      '#009fff': '#d97757', // Cursor, focus, and selection accent
      '#0190e7': '#e28d70',
      '#19283c': '#402d25', // Selection
      '#5ecc71': '#a6c486', // Strings
      '#86c427': '#a6c486',
      '#ffab16': '#e0b36b', // Namespaces
      '#ffd452': '#e0b36b', // Constants
      '#68cdf2': '#e0b36b', // Numbers
      '#ffca00': '#e0b36b',
      '#9d6afb': '#86b6ef', // Functions
      '#69b1ff': '#86b6ef', // Decorators
      '#d568ea': '#c3a2e0', // Types
      '#7b43f8': '#c3a2e0',
      '#ff855e': '#e694b8', // Tags and language variables
      '#e130ac': '#e694b8',
      '#60d199': '#7cc4be', // Attribute names
      '#64d1db': '#7cc4be', // Regular expressions
      '#61d5c0': '#7cc4be', // Escapes
      '#07c480': '#32d74b', // Additions
      '#0dbe4e': '#32d74b',
      '#ff2e3f': '#ff4d6d', // Deletions
    },
    overrides: {
      'editorLineNumber.foreground': '#807e78',
    },
  },
}

const HEX_COLOR = /^#([\da-f]{6})([\da-f]{2})?$/i

function recolor(value: unknown, colors: DiffPalette['colors']): unknown {
  if (typeof value === 'string') {
    const match = HEX_COLOR.exec(value)
    const mapped = match && colors[`#${match[1].toLowerCase()}`]
    return mapped ? `${mapped}${match[2] ?? ''}` : value
  }
  if (Array.isArray(value)) {
    return value.map((item) => recolor(item, colors))
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, recolor(item, colors)]),
    )
  }
  return value
}

export function recolorTheme<Theme extends { colors: Record<string, string> }>(
  theme: Theme,
  palette: DiffPalette,
): Theme {
  const recolored = recolor(theme, palette.colors) as Theme
  return {
    ...recolored,
    colors: { ...recolored.colors, ...palette.overrides },
  }
}

registerCustomTheme(diffThemes.light, async () => {
  const { default: theme } = await import('./themes/pierre/pierre-light.json')
  return {
    ...recolorTheme(theme, diffPalettes.light),
    name: diffThemes.light,
    type: 'light',
  }
})

registerCustomTheme(diffThemes.dark, async () => {
  const { default: theme } = await import('./themes/pierre/pierre-dark.json')
  return {
    ...recolorTheme(theme, diffPalettes.dark),
    name: diffThemes.dark,
    type: 'dark',
  }
})
