import { env } from 'cloudflare:workers'
import { createFileRoute } from '@tanstack/react-router'

import { loadDiff } from '../lib/diffs.server'
import { handleDiffDownload } from '../server/diff-download'

export const Route = createFileRoute('/d/$slug')({
  server: {
    handlers: {
      GET: ({ params }) =>
        handleDiffDownload(params.slug, (slug) => loadDiff(env.DIFFS, slug)),
    },
  },
})
