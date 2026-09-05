import { registerCustomTheme } from '@pierre/diffs'

// Local aliases ensure we use the copied themes, rather than a potentially
// different version bundled with @pierre/diffs. All theme colors stay intact.
export const diffThemes = {
  light: 'diffdump-pierre-light',
  dark: 'diffdump-pierre-dark',
} as const

registerCustomTheme(diffThemes.light, async () => {
  const { default: theme } = await import('./themes/pierre/pierre-light.json')
  return { ...structuredClone(theme), name: diffThemes.light, type: 'light' }
})

registerCustomTheme(diffThemes.dark, async () => {
  const { default: theme } = await import('./themes/pierre/pierre-dark.json')
  return { ...structuredClone(theme), name: diffThemes.dark, type: 'dark' }
})
