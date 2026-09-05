// @vitest-environment happy-dom

import { useState, type ComponentProps } from 'react'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import SubmitReviewPanel from './submit-review-panel'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import type { GitHubReviewEvent } from '../lib/review-comments'

vi.mock('@pierre/icons', () => ({
  IconArrowUpRight: () => null,
  IconCheck: () => null,
}))

afterEach(cleanup)

const defaultProps = {
  draftCount: 1,
  submitState: { phase: 'idle' } as const,
  reviewUrl: null,
  pullRequestUrl: null,
  onSubmit: vi.fn<(event: GitHubReviewEvent, body: string) => void>(),
  onReloadDiff: vi.fn<() => void>(),
  onClose: vi.fn<() => void>(),
}

function ReviewHarness({
  inPopover = false,
  ...props
}: Partial<ComponentProps<typeof SubmitReviewPanel>> & {
  inPopover?: boolean
}) {
  const [event, setEvent] = useState<GitHubReviewEvent>('COMMENT')
  const [body, setBody] = useState('')
  const [open, setOpen] = useState(false)
  const panel = (
    <SubmitReviewPanel
      {...defaultProps}
      event={event}
      body={body}
      onEventChange={setEvent}
      onBodyChange={setBody}
      onClose={() => setOpen(false)}
      {...props}
    />
  )

  return inPopover ? (
    <>
      <button type="button">Comments</button>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger>Review</PopoverTrigger>
        <PopoverContent aria-label="Review controls">{panel}</PopoverContent>
      </Popover>
    </>
  ) : (
    panel
  )
}

describe('SubmitReviewPanel', () => {
  it('changes the checked review type with arrow keys and submits it', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn<(event: GitHubReviewEvent, body: string) => void>()

    render(<ReviewHarness onSubmit={onSubmit} />)

    const comment = screen.getByRole('radio', { name: 'Comment' })
    const approve = screen.getByRole('radio', { name: 'Approve' })
    const summary = screen.getByRole('textbox', { name: 'Review summary' })

    expect(document.activeElement).toBe(summary)
    expect(comment.getAttribute('aria-checked')).toBe('true')
    expect(approve.getAttribute('aria-checked')).toBe('false')

    comment.focus()
    await user.keyboard('{ArrowDown}')

    expect(comment.getAttribute('aria-checked')).toBe('false')
    expect(approve.getAttribute('aria-checked')).toBe('true')

    await user.type(summary, 'Ready to merge')
    await user.click(screen.getByRole('button', { name: 'Submit review' }))

    expect(onSubmit).toHaveBeenCalledWith('APPROVE', 'Ready to merge')
  })

  it('disables review controls while submission is in progress', () => {
    render(<ReviewHarness submitState={{ phase: 'submitting' }} />)

    const summary = screen.getByRole('textbox', { name: 'Review summary' })
    const comment = screen.getByRole('radio', { name: 'Comment' })
    const submit = screen.getByRole('button', { name: 'Publishing…' })

    expect((summary as HTMLTextAreaElement).disabled).toBe(true)
    expect(comment.getAttribute('aria-disabled')).toBe('true')
    expect((submit as HTMLButtonElement).disabled).toBe(true)
  })

  it.each(['outside click', 'Escape', 'Close'])(
    'preserves the summary and review type after dismissal by %s',
    async (dismissal) => {
      const user = userEvent.setup()
      const onSubmit = vi.fn<(event: GitHubReviewEvent, body: string) => void>()
      render(<ReviewHarness inPopover onSubmit={onSubmit} />)

      const trigger = screen.getByRole('button', {
        name: 'Review',
      })
      await user.click(trigger)
      await user.type(
        screen.getByRole('textbox', { name: 'Review summary' }),
        'Please handle the empty result',
      )
      await user.click(screen.getByRole('radio', { name: 'Request changes' }))

      if (dismissal === 'Escape') {
        await user.keyboard('{Escape}')
      } else {
        await user.click(
          screen.getByRole('button', {
            name: dismissal === 'Close' ? 'Close' : 'Comments',
          }),
        )
      }
      await waitFor(() => {
        expect(
          screen.queryByRole('textbox', { name: 'Review summary' }),
        ).toBeNull()
      })

      await user.click(trigger)
      expect(
        (
          screen.getByRole('textbox', {
            name: 'Review summary',
          }) as HTMLTextAreaElement
        ).value,
      ).toBe('Please handle the empty result')
      expect(
        screen
          .getByRole('radio', { name: 'Request changes' })
          .getAttribute('aria-checked'),
      ).toBe('true')
      await user.click(screen.getByRole('button', { name: 'Submit review' }))
      expect(onSubmit).toHaveBeenCalledWith(
        'REQUEST_CHANGES',
        'Please handle the empty result',
      )
    },
  )
})
