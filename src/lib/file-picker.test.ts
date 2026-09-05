import { describe, expect, it } from 'vitest'
import { FileTree } from '@pierre/trees'

import {
  createDiffFilePickerEntries,
  prepareDiffFileTreeInput,
  summarizeDiffFilePickerFolders,
} from './file-picker'

describe('diff file picker entries', () => {
  it('searches files when patch order splits a directory into separate runs', () => {
    const paths = [
      'apps/app/src/durable-objects/upstream.ts',
      'plan.md',
      'apps/app/src/api/authenticated.ts',
    ]
    const tree = new FileTree({
      preparedInput: prepareDiffFileTreeInput(paths),
      flattenEmptyDirectories: true,
      initialExpansion: 'open',
      search: true,
    })

    try {
      expect(() => tree.setSearch('upstream')).not.toThrow()
      expect(tree.getSearchMatchingPaths()).toEqual([
        'apps/app/src/durable-objects/upstream.ts',
      ])
    } finally {
      tree.cleanUp()
    }
  })

  it('normalizes paths and maps diff changes to tree statuses', () => {
    expect(
      createDiffFilePickerEntries([
        {
          itemId: 'one',
          name: '/src//index.ts',
          type: 'change',
          category: 'source',
          additions: 2,
          deletions: 1,
          viewed: true,
        },
        {
          itemId: 'two',
          name: 'src/new.ts',
          type: 'new',
          category: 'source',
          additions: 3,
          deletions: 0,
          viewed: false,
        },
        {
          itemId: 'three',
          name: 'src/old.ts',
          type: 'deleted',
          category: 'source',
          additions: 0,
          deletions: 4,
          viewed: false,
        },
        {
          itemId: 'four',
          name: 'src/moved.ts',
          type: 'rename-changed',
          category: 'source',
          additions: 1,
          deletions: 1,
          viewed: false,
        },
      ]),
    ).toEqual([
      {
        itemId: 'one',
        path: 'src/index.ts',
        status: 'modified',
        category: 'source',
        additions: 2,
        deletions: 1,
        viewed: true,
      },
      {
        itemId: 'two',
        path: 'src/new.ts',
        status: 'added',
        category: 'source',
        additions: 3,
        deletions: 0,
        viewed: false,
      },
      {
        itemId: 'three',
        path: 'src/old.ts',
        status: 'deleted',
        category: 'source',
        additions: 0,
        deletions: 4,
        viewed: false,
      },
      {
        itemId: 'four',
        path: 'src/moved.ts',
        status: 'renamed',
        category: 'source',
        additions: 1,
        deletions: 1,
        viewed: false,
      },
    ])
  })

  it('keeps repeated file paths separately selectable', () => {
    expect(
      createDiffFilePickerEntries([
        {
          itemId: 'one',
          name: 'src/index.ts',
          type: 'change',
          category: 'source',
          additions: 1,
          deletions: 0,
          viewed: false,
        },
        {
          itemId: 'two',
          name: 'src/index.ts',
          type: 'change',
          category: 'tests',
          additions: 2,
          deletions: 1,
          viewed: true,
        },
      ]),
    ).toEqual([
      {
        itemId: 'one',
        path: 'src/index.ts',
        status: 'modified',
        category: 'source',
        additions: 1,
        deletions: 0,
        viewed: false,
      },
      {
        itemId: 'two',
        path: 'src/index (2).ts',
        status: 'modified',
        category: 'tests',
        additions: 2,
        deletions: 1,
        viewed: true,
      },
    ])
  })

  it('summarizes changed files and line counts for every ancestor folder', () => {
    const entries = createDiffFilePickerEntries([
      {
        itemId: 'one',
        name: 'src/components/button.tsx',
        type: 'change',
        category: 'source',
        additions: 8,
        deletions: 3,
        viewed: false,
      },
      {
        itemId: 'two',
        name: 'src/components/input.tsx',
        type: 'new',
        category: 'source',
        additions: 5,
        deletions: 0,
        viewed: false,
      },
      {
        itemId: 'three',
        name: 'src/index.ts',
        type: 'change',
        category: 'source',
        additions: 2,
        deletions: 1,
        viewed: false,
      },
      {
        itemId: 'root',
        name: 'README.md',
        type: 'change',
        category: 'docs',
        additions: 20,
        deletions: 10,
        viewed: false,
      },
    ])

    expect([...summarizeDiffFilePickerFolders(entries)]).toEqual([
      ['src/components/', { files: 2, additions: 13, deletions: 3 }],
      ['src/', { files: 3, additions: 15, deletions: 4 }],
    ])
  })
})
