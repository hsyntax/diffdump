import { diffArrays } from 'diff'
import type {
  ChangeContent,
  ContextContent,
  FileDiffMetadata,
  Hunk,
} from '@pierre/diffs'

type HunkBlock = ContextContent | ChangeContent

export type WhitespaceHiddenDiff = {
  /** The diff to render: the input itself when nothing changes, otherwise a
   * copy whose hunks show whitespace-only changes as unchanged lines. */
  file: FileDiffMetadata
  /** Changed lines that differ from their counterpart only in whitespace. */
  hiddenLineCount: number
  /** The file had changes, and every one of them was whitespace-only. */
  whitespaceOnly: boolean
}

/* Matches `git diff -w` and GitHub's Hide whitespace: lines compare with every
   ASCII whitespace character removed, so indentation (including indentation
   added at column 0), trailing spaces, CRLF endings, and spacing inside a line
   are all ignored. */
const WHITESPACE_PATTERN = /[\t\n\v\f\r ]+/g

/* Re-diffing a hunk costs O((N+M)·D). Hunks that need more edits than this
   keep their original shape instead of stalling the main thread. */
const MAX_EDIT_LENGTH = 1000

const cache = new WeakMap<FileDiffMetadata, WhitespaceHiddenDiff>()

/**
 * Re-diffs each hunk of a parsed patch with whitespace ignored, so lines that
 * differ only in whitespace render as context — `git diff -w` applied within
 * each hunk. The whole hunk is re-diffed, not each change block: the original
 * diff often pairs identical lines across a reindented region (a closing
 * brace, a blank line), and those anchors would otherwise stop reindented
 * lines from lining up.
 *
 * Patches carry no surrounding file content, so unlike `git diff -w` the hunks
 * keep their boundaries: every line of the patch still renders, line numbers
 * are untouched, and review comments anchor exactly as they do on the full
 * diff. Hunk expansion keeps the new shape because hydration re-indexes the
 * existing blocks instead of recomputing the diff.
 *
 * Results are cached per input so each file keeps one stable (and, once
 * expanded, hydrated) whitespace-hidden diff across toggles.
 */
export function hideWhitespaceChanges(
  file: FileDiffMetadata,
): WhitespaceHiddenDiff {
  let result = cache.get(file)
  if (result === undefined) {
    result = computeWhitespaceHiddenDiff(file)
    cache.set(file, result)
  }

  return result
}

function computeWhitespaceHiddenDiff(
  file: FileDiffMetadata,
): WhitespaceHiddenDiff {
  let hiddenLineCount = 0
  let hadChanges = false
  let hasChanges = false
  let splitOffset = 0
  let unifiedOffset = 0

  const hunks = file.hunks.map((hunk): Hunk => {
    const shifted = {
      ...hunk,
      splitLineStart: hunk.splitLineStart + splitOffset,
      unifiedLineStart: hunk.unifiedLineStart + unifiedOffset,
    }
    const hunkHasChanges = hunk.hunkContent.some(
      (block) => block.type === 'change',
    )
    hadChanges ||= hunkHasChanges

    const rediffed = hunkHasChanges ? rediffHunk(file, hunk) : null
    if (rediffed === null) {
      hasChanges ||= hunkHasChanges
      return shifted
    }

    hiddenLineCount += rediffed.hiddenLineCount
    hasChanges ||= rediffed.hunkContent.some((block) => block.type === 'change')
    const counts = countHunkLines(rediffed.hunkContent)
    splitOffset += counts.splitLineCount - hunk.splitLineCount
    unifiedOffset += counts.unifiedLineCount - hunk.unifiedLineCount

    return { ...shifted, ...counts, hunkContent: rediffed.hunkContent }
  })

  if (hiddenLineCount === 0) {
    return { file, hiddenLineCount: 0, whitespaceOnly: false }
  }

  return {
    file: {
      ...file,
      hunks,
      splitLineCount: file.splitLineCount + splitOffset,
      unifiedLineCount: file.unifiedLineCount + unifiedOffset,
      /* The worker caches highlighted output per key, including the inline
         word diffs computed from change pairs, so the reshaped diff needs a
         key of its own. */
      cacheKey:
        file.cacheKey === undefined
          ? undefined
          : `${file.cacheKey}:hide-whitespace`,
    },
    hiddenLineCount,
    whitespaceOnly: hadChanges && !hasChanges,
  }
}

/**
 * Re-diffs one hunk's old and new lines with whitespace removed. Returns null
 * when no line pair differs only in whitespace, so hunks unaffected by
 * whitespace keep the shape the original diff gave them.
 */
function rediffHunk(
  file: FileDiffMetadata,
  hunk: Hunk,
): { hunkContent: HunkBlock[]; hiddenLineCount: number } | null {
  /* When exactly one side lacks a final newline, the last old and new lines
     differ and the hunk must end in a change: a trailing context block
     implies both sides agree. */
  const finalPair = hunk.noEOFCRDeletions !== hunk.noEOFCRAdditions ? 1 : 0
  const oldLines = file.deletionLines.slice(
    hunk.deletionLineIndex,
    hunk.deletionLineIndex + hunk.deletionCount - finalPair,
  )
  const newLines = file.additionLines.slice(
    hunk.additionLineIndex,
    hunk.additionLineIndex + hunk.additionCount - finalPair,
  )

  if (oldLines.length === 0 || newLines.length === 0) {
    return null
  }

  const oldKeys = oldLines.map(stripWhitespace)
  const newKeys = newLines.map(stripWhitespace)
  if (!hasWhitespaceOnlyPair(oldLines, oldKeys, newLines, newKeys)) {
    return null
  }

  const changes = diffArrays(oldKeys, newKeys, {
    maxEditLength: MAX_EDIT_LENGTH,
  })
  if (changes === undefined) {
    return null
  }

  const hunkContent: HunkBlock[] = []
  let hiddenLineCount = 0
  let oldOffset = 0
  let newOffset = 0

  for (const change of changes) {
    if (change.removed || change.added) {
      pushBlock(hunkContent, {
        type: 'change',
        deletions: change.removed ? change.count : 0,
        deletionLineIndex: hunk.deletionLineIndex + oldOffset,
        additions: change.added ? change.count : 0,
        additionLineIndex: hunk.additionLineIndex + newOffset,
      })
      if (change.removed) {
        oldOffset += change.count
      } else {
        newOffset += change.count
      }
      continue
    }

    for (let line = 0; line < change.count; line += 1) {
      if (oldLines[oldOffset + line] !== newLines[newOffset + line]) {
        hiddenLineCount += 1
      }
    }
    pushBlock(hunkContent, {
      type: 'context',
      lines: change.count,
      deletionLineIndex: hunk.deletionLineIndex + oldOffset,
      additionLineIndex: hunk.additionLineIndex + newOffset,
    })
    oldOffset += change.count
    newOffset += change.count
  }

  /* The re-diff may pair identical lines (a closing brace, a blank line)
     instead of the whitespace-only pair; such a hunk keeps its shape. */
  if (hiddenLineCount === 0) {
    return null
  }

  if (finalPair > 0) {
    pushBlock(hunkContent, {
      type: 'change',
      deletions: 1,
      deletionLineIndex: hunk.deletionLineIndex + oldOffset,
      additions: 1,
      additionLineIndex: hunk.additionLineIndex + newOffset,
    })
  }

  return { hunkContent, hiddenLineCount }
}

function stripWhitespace(line: string): string {
  return line.replace(WHITESPACE_PATTERN, '')
}

/** Whether some old and new line are equal only once whitespace is removed —
 * a cheap check that skips re-diffing unaffected hunks. */
function hasWhitespaceOnlyPair(
  oldLines: readonly string[],
  oldKeys: readonly string[],
  newLines: readonly string[],
  newKeys: readonly string[],
): boolean {
  const oldLinesByKey = new Map<string, Set<string>>()
  for (const [index, key] of oldKeys.entries()) {
    let lines = oldLinesByKey.get(key)
    if (lines === undefined) {
      lines = new Set()
      oldLinesByKey.set(key, lines)
    }
    lines.add(oldLines[index])
  }

  return newKeys.some((key, index) => {
    const lines = oldLinesByKey.get(key)
    return (
      lines !== undefined && (lines.size > 1 || !lines.has(newLines[index]))
    )
  })
}

/** Appends a block, merging it into the previous one when both are the same
 * kind. Blocks always arrive contiguous, so merging only sums their counts. */
function pushBlock(blocks: HunkBlock[], block: HunkBlock): void {
  const previous = blocks.at(-1)

  if (previous?.type === 'context' && block.type === 'context') {
    previous.lines += block.lines
  } else if (previous?.type === 'change' && block.type === 'change') {
    previous.deletions += block.deletions
    previous.additions += block.additions
  } else {
    blocks.push(block)
  }
}

/** Per-hunk line totals, computed the way the library counts rendered rows:
 * split view pairs deletions with additions side by side. */
export function countHunkLines(hunkContent: readonly HunkBlock[]) {
  let additionLines = 0
  let deletionLines = 0
  let splitLineCount = 0
  let unifiedLineCount = 0

  for (const block of hunkContent) {
    if (block.type === 'context') {
      splitLineCount += block.lines
      unifiedLineCount += block.lines
    } else {
      additionLines += block.additions
      deletionLines += block.deletions
      splitLineCount += Math.max(block.additions, block.deletions)
      unifiedLineCount += block.additions + block.deletions
    }
  }

  return { additionLines, deletionLines, splitLineCount, unifiedLineCount }
}
