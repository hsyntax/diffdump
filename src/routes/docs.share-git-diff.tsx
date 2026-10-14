import { createFileRoute } from '@tanstack/react-router'

import {
  GuideCode,
  GuideLinkCards,
  GuidePage,
  GuideSection,
} from '../components/guide-page'
import { createPageHead, createTechArticleStructuredData } from '../lib/seo'

const title = 'Share a Git Diff Online with an Expiring Link | Diffdump'
const description =
  'Share a unified Git diff with an unlisted 24-hour review link, then download the original patch from the viewer or with curl.'
const path = '/docs/share-git-diff' as const
const datePublished = '2026-07-29'
const dateModified = '2026-10-14'

export const Route = createFileRoute('/docs/share-git-diff')({
  head: () => ({
    ...createPageHead({ title, description, path, ogType: 'article' }),
    scripts: [
      {
        type: 'application/ld+json',
        children: JSON.stringify(
          createTechArticleStructuredData({
            title,
            description,
            path,
            datePublished,
            dateModified,
          }),
        ),
      },
    ],
  }),
  component: ShareGitDiffGuide,
})

function ShareGitDiffGuide() {
  return (
    <GuidePage
      eyebrow="Share a Git diff"
      title="Turn a raw patch into a clean review link."
      summary="Diffdump turns a unified Git diff into an unlisted browser view with syntax highlighting, file navigation, and split or unified layouts. Share links use random URLs, accept patches up to 2 MiB, and expire after 24 hours."
      actionLabel="Create a share link"
      dateModified={dateModified}
    >
      <GuideSection title="Share a diff from the browser">
        <ol className="list-decimal space-y-3 pl-5 marker:text-muted-foreground">
          <li>
            Open Diffdump and select the{' '}
            <code className="font-mono text-foreground">diff.patch</code> tab.
          </li>
          <li>Paste a UTF-8 unified diff into the editor.</li>
          <li>
            Create the link, review the rendered patch, and send the URL to your
            reviewer.
          </li>
        </ol>
      </GuideSection>

      <GuideSection title="Share a diff from the terminal">
        <p>
          Send the working-tree patch with one command. Diffdump returns the new
          share URL as plain text.
        </p>
        <GuideCode>{`git diff | curl -T- https://diffdump.com/d`}</GuideCode>
        <p>
          On macOS, append{' '}
          <code className="font-mono text-foreground">| xargs open</code> to
          open the returned URL immediately.
        </p>
        <GuideCode>{`git diff | curl -T- https://diffdump.com/d | xargs open`}</GuideCode>
      </GuideSection>

      <GuideSection title="Download an uploaded diff">
        <p>
          Open the shared review link and select <strong>Download diff</strong>{' '}
          beside <strong>Copy link</strong> to save the original uploaded patch
          as{' '}
          <code className="font-mono text-foreground">
            {'diffdump-<slug>.diff'}
          </code>
          . File filters and whitespace settings in the viewer do not change the
          downloaded patch.
        </p>
        <p>
          To download from the terminal, replace{' '}
          <code className="font-mono text-foreground">/view/</code> in the share
          URL with <code className="font-mono text-foreground">/d/</code>.
          Replace <code className="font-mono text-foreground">YOUR_SLUG</code>{' '}
          below with the slug from your share URL:
        </p>
        <GuideCode>{`curl -fS https://diffdump.com/d/YOUR_SLUG -o changes.diff`}</GuideCode>
        <p>
          Downloads use the share’s original 24-hour expiry. Downloading does
          not extend it. Missing, invalid, or expired share links return{' '}
          <code className="font-mono text-foreground">404</code>.
        </p>
      </GuideSection>

      <GuideSection title="What is stored?">
        <p>
          Raw shared diffs are stored in a private Cloudflare R2 bucket under a
          random 96-bit URL slug. Each request checks the stored expiration
          time, so links stop working after 24 hours. An R2 lifecycle rule
          deletes the expired objects afterward.
        </p>
        <p>
          Links are unlisted rather than access-controlled: anyone who has the
          URL can open the diff. Remove credentials, private keys, and other
          secrets before sharing.
        </p>
      </GuideSection>

      <GuideSection title="Expand unchanged lines from GitHub">
        <p>
          Terminal uploads can include a GitHub repository and full base commit
          SHA. When a reviewer expands collapsed context, their browser fetches
          the base file directly from GitHub and applies the shared patch
          locally. Public repositories work anonymously; private repositories
          use the reviewer’s locally saved GitHub token.{' '}
          <code className="font-mono text-foreground">core.quotepath=off</code>{' '}
          keeps non-ASCII file paths literal in the patch so their context stays
          expandable.
        </p>
        <GuideCode>{`BASE_SHA=$(git rev-parse HEAD)
git -c core.quotepath=off diff --full-index --binary "$BASE_SHA" |
  curl -T- \\
    -H "X-Diffdump-GitHub-Repo: org/repository" \\
    -H "X-Diffdump-Base-Sha: $BASE_SHA" \\
    https://diffdump.com/d`}</GuideCode>
      </GuideSection>

      <GuideSection title="What can be shared?">
        <ul className="list-disc space-y-2 pl-5 marker:text-muted-foreground">
          <li>Working-tree or staged changes from a Git repository.</li>
          <li>A commit exported as a unified patch.</li>
          <li>
            Multi-file <code className="font-mono text-foreground">.diff</code>{' '}
            and <code className="font-mono text-foreground">.patch</code>{' '}
            content up to 2 MiB.
          </li>
          <li>Agent-generated code changes that need human review.</li>
        </ul>
      </GuideSection>

      <GuideLinkCards current="share" />
    </GuidePage>
  )
}
