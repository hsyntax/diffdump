import { validateShareSlug, type StoredDiff } from '../lib/diffs'

type LoadSharedDiff = (slug: string) => Promise<StoredDiff | null>

const headers = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow',
}

export async function handleDiffDownload(
  slug: string,
  loadSharedDiff: LoadSharedDiff,
): Promise<Response> {
  try {
    validateShareSlug(slug)
  } catch {
    return missingDiffResponse()
  }

  let storedDiff: StoredDiff | null
  try {
    storedDiff = await loadSharedDiff(slug)
  } catch {
    return new Response(
      'The diff could not be downloaded. Please try again.\n',
      {
        status: 500,
        headers: { ...headers, 'Content-Type': 'text/plain; charset=utf-8' },
      },
    )
  }

  if (!storedDiff) {
    return missingDiffResponse()
  }

  return new Response(storedDiff.diff, {
    headers: {
      ...headers,
      'Content-Type': 'text/x-diff; charset=utf-8',
      'Content-Disposition': `attachment; filename="diffdump-${slug}.diff"`,
    },
  })
}

function missingDiffResponse(): Response {
  return new Response('This diff is missing or has expired.\n', {
    status: 404,
    headers: { ...headers, 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
