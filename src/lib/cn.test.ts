import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { cn } from './cn'

const styles = readFileSync('src/styles.css', 'utf8')

function themeTokens(namespace: string): string[] {
  return [...styles.matchAll(new RegExp(`--${namespace}-([\\w-]+):`, 'g'))].map(
    (match) => match[1],
  )
}

describe('cn', () => {
  it.each(themeTokens('text'))('merges text-%s as a font size', (token) => {
    expect(cn(`text-xs text-${token}`)).toBe(`text-${token}`)
    expect(cn(`text-${token} text-foreground`)).toBe(
      `text-${token} text-foreground`,
    )
  })

  it.each(themeTokens('font-weight'))(
    'merges font-%s as a font weight',
    (token) => {
      expect(cn(`font-medium font-${token}`)).toBe(`font-${token}`)
      expect(cn(`font-mono font-${token}`)).toBe(`font-mono font-${token}`)
    },
  )

  it.each(themeTokens('leading'))('merges leading-%s', (token) => {
    expect(cn(`leading-snug leading-${token}`)).toBe(`leading-${token}`)
  })

  it.each(themeTokens('tracking'))('merges tracking-%s', (token) => {
    expect(cn(`tracking-wide tracking-${token}`)).toBe(`tracking-${token}`)
  })
})
