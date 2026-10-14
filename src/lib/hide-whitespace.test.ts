import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'
import {
  hydratePartialDiff,
  parsePatchFiles,
  type FileDiffMetadata,
} from '@pierre/diffs'

import { countHunkLines, hideWhitespaceChanges } from './hide-whitespace'

let cacheKeyPrefix = 0

function parseFile(lines: readonly string[]): FileDiffMetadata {
  cacheKeyPrefix += 1
  const [file] = parsePatchFiles(
    `${lines.join('\n')}\n`,
    `test-${cacheKeyPrefix}`,
    true,
  ).flatMap((patch) => patch.files)
  if (!file) throw new Error('The test patch has no files.')
  return file
}

function patch(name: string, hunkLines: readonly string[]): string[] {
  return [
    `diff --git a/${name} b/${name}`,
    'index 1111111..2222222 100644',
    `--- a/${name}`,
    `+++ b/${name}`,
    ...hunkLines,
  ]
}

function blockShapes(file: FileDiffMetadata) {
  return file.hunks.map((hunk) =>
    hunk.hunkContent.map((block) =>
      block.type === 'context'
        ? { context: block.lines }
        : { deletions: block.deletions, additions: block.additions },
    ),
  )
}

/* Wrapping two calls in a conditional reindents them. */
const WRAPPED_CALLS = patch('src/run.ts', [
  '@@ -1,4 +1,6 @@',
  ' export function run() {',
  '-  step()',
  '-  finish()',
  '+  if (ready) {',
  '+    step()',
  '+    finish()',
  '+  }',
  ' }',
])

describe('hideWhitespaceChanges', () => {
  it('shows reindented lines as context and keeps the real changes', () => {
    const original = parseFile(WRAPPED_CALLS)
    const { file, hiddenLineCount, whitespaceOnly } =
      hideWhitespaceChanges(original)

    /* Same alignment as `git diff -w`: the old closing brace pairs with the
       new `  }`, and the function's closing brace is the added line. */
    expect(blockShapes(file)).toEqual([
      [
        { context: 1 },
        { deletions: 0, additions: 1 },
        { context: 3 },
        { deletions: 0, additions: 1 },
      ],
    ])
    expect(hiddenLineCount).toBe(3)
    expect(whitespaceOnly).toBe(false)

    const [hunk] = file.hunks
    const [originalHunk] = original.hunks
    expect(hunk).toMatchObject({
      deletionStart: originalHunk!.deletionStart,
      deletionCount: originalHunk!.deletionCount,
      additionStart: originalHunk!.additionStart,
      additionCount: originalHunk!.additionCount,
      hunkSpecs: originalHunk!.hunkSpecs,
      additionLines: 2,
      deletionLines: 0,
      splitLineCount: 6,
      unifiedLineCount: 6,
    })
    expect(file.unifiedLineCount).toBe(original.unifiedLineCount - 2)
    expect(file.splitLineCount).toBe(original.splitLineCount)
  })

  it('lines up reindented lines the original diff split around an unchanged line', () => {
    /* The closing brace matched as context, leaving the deleted and re-added
       calls in separate change blocks; only a whole-hunk re-diff pairs them. */
    const original = parseFile(
      patch('src/moved.ts', [
        '@@ -1,3 +1,3 @@',
        '-  one()',
        '-  two()',
        ' }',
        '+    one()',
        '+    two()',
      ]),
    )
    const { file, hiddenLineCount } = hideWhitespaceChanges(original)

    expect(blockShapes(file)).toEqual([
      [
        { deletions: 0, additions: 1 },
        { context: 2 },
        { deletions: 1, additions: 0 },
      ],
    ])
    expect(hiddenLineCount).toBe(2)
  })

  it('reuses the patch line arrays so line numbers and text are untouched', () => {
    const original = parseFile(WRAPPED_CALLS)
    const { file } = hideWhitespaceChanges(original)
    const context = file.hunks[0]!.hunkContent[2]!

    expect(file.deletionLines).toBe(original.deletionLines)
    expect(file.additionLines).toBe(original.additionLines)
    expect(context.type).toBe('context')
    /* Split view renders each side of a context row from its own array. */
    expect(file.deletionLines[context.deletionLineIndex]).toBe('  step()\n')
    expect(file.additionLines[context.additionLineIndex]).toBe('    step()\n')
  })

  it('ignores whitespace the way git diff -w does', () => {
    const original = parseFile(
      patch('src/format.ts', [
        '@@ -1,4 +1,4 @@',
        '-const a = 1',
        '-const b  =  2   ',
        '-if (x) {return}',
        '+  const a = 1',
        '+const b = 2',
        '+if (x) { return }',
        ' done()',
      ]),
    )
    const { file, hiddenLineCount, whitespaceOnly } =
      hideWhitespaceChanges(original)

    expect(blockShapes(file)).toEqual([[{ context: 4 }]])
    expect(hiddenLineCount).toBe(3)
    expect(whitespaceOnly).toBe(true)
    expect(file.hunks[0]).toMatchObject({ additionLines: 0, deletionLines: 0 })
  })

  it('ignores CRLF line endings', () => {
    const original = parseFile(
      patch('src/crlf.ts', [
        '@@ -1,2 +1,2 @@',
        '-first\r',
        '-second\r',
        '+first',
        '+second',
      ]),
    )

    expect(hideWhitespaceChanges(original)).toMatchObject({
      hiddenLineCount: 2,
      whitespaceOnly: true,
    })
  })

  it('returns the same diff when no change is whitespace-only', () => {
    const renamed = parseFile(
      patch('src/rename.ts', [
        '@@ -1,3 +1,3 @@',
        ' const value = 1',
        '-console.log(value)',
        '+logger.info(value)',
        ' export {}',
      ]),
    )
    const addedOnly = parseFile(
      patch('src/added.ts', [
        '@@ -1,1 +1,2 @@',
        ' const value = 1',
        '+  const other = 2',
      ]),
    )
    /* A closing brace moved without any whitespace change. */
    const identicalPair = parseFile(
      patch('src/brace.ts', [
        '@@ -1,2 +1,2 @@',
        '-}',
        '-old()',
        '+new()',
        '+}',
      ]),
    )

    for (const original of [renamed, addedOnly, identicalPair]) {
      expect(hideWhitespaceChanges(original)).toEqual({
        file: original,
        hiddenLineCount: 0,
        whitespaceOnly: false,
      })
    }
  })

  it('keeps the final pair changed when only one side lacks a final newline', () => {
    const original = parseFile(
      patch('src/eof.ts', [
        '@@ -1,2 +1,2 @@',
        '-  first',
        '-  last',
        '\\ No newline at end of file',
        '+first',
        '+last',
      ]),
    )
    const { file, hiddenLineCount } = hideWhitespaceChanges(original)

    expect(blockShapes(file)).toEqual([
      [{ context: 1 }, { deletions: 1, additions: 1 }],
    ])
    expect(hiddenLineCount).toBe(1)
    expect(file.hunks[0]).toMatchObject({
      noEOFCRDeletions: true,
      noEOFCRAdditions: false,
    })
  })

  it('shifts the rendered row offsets of later hunks', () => {
    const original = parseFile([
      ...WRAPPED_CALLS,
      '@@ -20,3 +22,3 @@',
      ' const a = 1',
      '-const b = 2',
      '+const b = 3',
      ' const c = 4',
    ])
    const { file } = hideWhitespaceChanges(original)
    const [, second] = file.hunks
    const [, originalSecond] = original.hunks

    expect(second!.hunkContent).toBe(originalSecond!.hunkContent)
    expect(second!.unifiedLineStart).toBe(originalSecond!.unifiedLineStart - 2)
    expect(second!.splitLineStart).toBe(originalSecond!.splitLineStart)
  })

  it('gives the reshaped diff its own highlight cache key and caches the result', () => {
    const original = parseFile(WRAPPED_CALLS)
    const result = hideWhitespaceChanges(original)

    expect(result.file.cacheKey).toBe(`${original.cacheKey}:hide-whitespace`)
    expect(hideWhitespaceChanges(original)).toBe(result)
  })

  it('keeps its shape when hunk expansion hydrates the full files', () => {
    const original = parseFile([
      'diff --git a/src/run.ts b/src/run.ts',
      'index 1111111..2222222 100644',
      '--- a/src/run.ts',
      '+++ b/src/run.ts',
      '@@ -3,4 +3,6 @@',
      ' export function run() {',
      '-  step()',
      '-  finish()',
      '+  if (ready) {',
      '+    step()',
      '+    finish()',
      '+  }',
      ' }',
    ])
    const { file } = hideWhitespaceChanges(original)
    const hydrated = hydratePartialDiff('clone', file, {
      oldFile: {
        name: 'src/run.ts',
        contents:
          '// header\n\nexport function run() {\n  step()\n  finish()\n}\n',
      },
      newFile: {
        name: 'src/run.ts',
        contents:
          '// header\n\nexport function run() {\n  if (ready) {\n    step()\n    finish()\n  }\n}\n',
      },
    })
    const context = hydrated.hunks[0]!.hunkContent[2]!

    expect(blockShapes(hydrated)).toEqual(blockShapes(file))
    expect(hydrated.additionLines[context.additionLineIndex]).toBe(
      '    step()\n',
    )
    expect(hydrated.deletionLines[context.deletionLineIndex]).toBe('  step()\n')
  })

  it('leaves blocks that need too many edits to re-diff unchanged', () => {
    const deleted = Array.from({ length: 1500 }, (_, index) => `-old ${index}`)
    const added = Array.from({ length: 1500 }, (_, index) => `+new ${index}`)
    const original = parseFile(
      patch('src/big.ts', [
        '@@ -1,1501 +1,1501 @@',
        ...deleted,
        '-  moved',
        ...added,
        '+moved',
      ]),
    )

    expect(hideWhitespaceChanges(original).file).toBe(original)
  })
})

describe('countHunkLines', () => {
  it('matches the row counts the library parses from a real patch', () => {
    const fixture = readFileSync(
      new URL('../fixtures/tanstack-router-7883.diff', import.meta.url),
      'utf8',
    )
    const hunks = parsePatchFiles(fixture, 'fixture', true)
      .flatMap((parsed) => parsed.files)
      .flatMap((file) => file.hunks)

    expect(hunks.length).toBeGreaterThan(0)
    for (const hunk of hunks) {
      expect(countHunkLines(hunk.hunkContent)).toEqual({
        additionLines: hunk.additionLines,
        deletionLines: hunk.deletionLines,
        splitLineCount: hunk.splitLineCount,
        unifiedLineCount: hunk.unifiedLineCount,
      })
    }
  })
})
