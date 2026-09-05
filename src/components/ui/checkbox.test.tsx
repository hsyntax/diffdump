// @vitest-environment jsdom

// Base UI dispatches constructed clicks for keyboard activation. Happy DOM
// misses React's change notification for these clicks; jsdom handles it.
import { useState } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Checkbox } from './checkbox'

vi.mock('@pierre/icons', () => ({ IconCheck: () => null }))

afterEach(cleanup)

describe('Checkbox', () => {
  it('toggles a checkbox from its label and the keyboard', async () => {
    const user = userEvent.setup()

    function ViewedControl() {
      const [checked, setChecked] = useState(false)

      return (
        <>
          <label htmlFor="viewed-checkbox">
            <Checkbox
              id="viewed-checkbox"
              checked={checked}
              onCheckedChange={setChecked}
            />
            Viewed
          </label>
          <output>{checked ? 'viewed' : 'not viewed'}</output>
        </>
      )
    }

    render(<ViewedControl />)

    const checkbox = screen.getByRole('checkbox', { name: 'Viewed' })
    expect(checkbox.getAttribute('aria-checked')).toBe('false')

    await user.click(screen.getByText('Viewed'))

    expect(checkbox.getAttribute('aria-checked')).toBe('true')
    expect(screen.getByText('viewed')).not.toBeNull()

    checkbox.focus()
    await user.keyboard(' ')

    expect(checkbox.getAttribute('aria-checked')).toBe('false')
    expect(screen.getByText('not viewed')).not.toBeNull()
  })

  it('reports indeterminate and disabled checkbox states', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn<(checked: boolean) => void>()

    render(
      <>
        <Checkbox indeterminate aria-label="Some files viewed" />
        <label htmlFor="locked-checkbox">
          <Checkbox
            id="locked-checkbox"
            disabled
            onCheckedChange={onCheckedChange}
          />
          Locked
        </label>
      </>,
    )

    expect(
      screen
        .getByRole('checkbox', { name: 'Some files viewed' })
        .getAttribute('aria-checked'),
    ).toBe('mixed')

    const disabled = screen.getByRole('checkbox', { name: 'Locked' })
    expect(disabled.getAttribute('aria-disabled')).toBe('true')
    await user.click(screen.getByText('Locked'))

    expect(onCheckedChange).not.toHaveBeenCalled()
  })
})
