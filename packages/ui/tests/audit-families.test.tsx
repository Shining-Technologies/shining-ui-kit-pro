/**
 * Regression tests for defects found while documenting the button, badge,
 * avatar, card and overlay families. Each `it` names the behaviour that used to
 * be wrong.
 */
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AvatarGroup,
  CopyButton,
  Dialog,
  DialogContent,
  MetricTile,
  StatsCard,
  StatusFlow,
  StepCard,
  UserAvatar,
} from '@shining-technologies/ui'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'

// Not `new URL(…, import.meta.url)`: under happy-dom `URL` is the DOM's, which refuses file: URLs.
const STYLES = join(resolve(__dirname, '..'), 'src', 'styles')
const stylesheet = (name: string) =>
  readFileSync(join(STYLES, name), 'utf8').replace(/\r\n/g, '\n').replace(/\s+/g, ' ')

/* -------------------------------------------------------------- avatar group */

describe('avatar group with user avatars', () => {
  it('marks the +n chip so the stylesheet can size it like the avatars', () => {
    render(
      <AvatarGroup max={2}>
        <UserAvatar name="Ana Ortiz" size="lg" />
        <UserAvatar name="Priya Raman" size="lg" />
        <UserAvatar name="Sam Lee" size="lg" />
      </AvatarGroup>,
    )
    const chip = screen.getByRole('img', { name: '1 more' })
    expect(chip).toHaveClass('sui-avatar', 'sui-avatar-group__more')
  })

  it('overlaps and rings user avatars, and sizes the chip from them', () => {
    const css = stylesheet('surfaces.css')
    expect(css).toContain('.sui-avatar-group > :is(.sui-avatar, .sui-user-avatar):not(:first-child)')
    expect(css).toContain('.sui-avatar-group > .sui-user-avatar > .sui-user-avatar__avatar')
    for (const size of ['xs', 'sm', 'lg', 'xl']) {
      expect(css).toContain(`.sui-avatar-group:has(> .sui-user-avatar--${size}) > .sui-avatar-group__more`)
    }
    // The default UserAvatar (2.25rem) is larger than the default Avatar the chip starts as.
    expect(css).toMatch(/:has\(> \.sui-user-avatar:not\([^)]*\)\) > \.sui-avatar-group__more \{ width: 2\.25rem;/)
  })
})

/* -------------------------------------------------------------- alert dialog */

describe('alert dialog content', () => {
  it('cannot be turned back into a dismissable dialog through its props', async () => {
    render(
      <AlertDialog open>
        <AlertDialogContent hideClose={false} role="dialog">
          <AlertDialogTitle>Delete the job?</AlertDialogTitle>
        </AlertDialogContent>
      </AlertDialog>,
    )
    expect(await screen.findByRole('alertdialog', { name: 'Delete the job?' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
  })
})

/* --------------------------------------------------- unnamed dialog warning */

describe('unnamed dialog warning advice', () => {
  it('suggests markup that stays valid: a classed title or an aria-label', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(
      <Dialog open>
        <DialogContent>
          <p>No title here</p>
        </DialogContent>
      </Dialog>,
    )
    await waitFor(() => expect(warn).toHaveBeenCalled())
    const message = String(warn.mock.calls.find(([text]) => /accessible name/.test(String(text)))?.[0])
    expect(message).toContain('<DialogTitle>')
    expect(message).toContain('className="sui-visually-hidden"')
    expect(message).toContain('aria-label')
    expect(message).not.toContain('VisuallyHidden>')
    warn.mockRestore()
  })
})

/* ---------------------------------------------------------------- copy button */

describe('copy button name and announcement', () => {
  function withClipboard() {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    return writeText
  }

  it('keeps `label` as the name with children, before and after copying', async () => {
    const user = userEvent.setup()
    withClipboard()
    render(
      <CopyButton value="INV-7" label="Copy invoice number" copiedAnnouncement="Invoice number copied">
        Copy
      </CopyButton>,
    )
    const button = screen.getByRole('button', { name: 'Copy invoice number' })
    await user.click(button)
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Invoice number copied'))
    expect(button).toHaveAccessibleName('Copy invoice number')
    expect(button).toHaveTextContent('Copied')
    // A live region inside a button is presentational and may never be announced.
    expect(button).not.toContainElement(screen.getByRole('status'))
  })

  it('keeps a button group’s end corners when a copy button adds its live region', () => {
    const css = stylesheet('primitives.css')
    expect(css).toContain('.sui-button-group > .sui-btn:nth-child(1 of .sui-btn)')
    expect(css).toContain('.sui-button-group > .sui-btn:nth-last-child(1 of .sui-btn)')
    expect(css).not.toMatch(/\.sui-button-group > \.sui-btn:(first|last)-child/)
  })

  it('names a labelled button by its text, not by the swapped confirmation', async () => {
    const user = userEvent.setup()
    withClipboard()
    render(<CopyButton value="https://example.com">Copy link</CopyButton>)
    const button = screen.getByRole('button', { name: 'Copy link' })
    await user.click(button)
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Copied to clipboard'))
    expect(button).toHaveAccessibleName('Copy link')
  })
})

/* ---------------------------------------------------------------- stats card */

describe('clickable stats card with a chart', () => {
  it('keeps block content out of its button and stays operable', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    const ref = createRef<HTMLDivElement>()
    const { container } = render(
      <StatsCard
        ref={ref}
        label="Crews"
        value="24"
        change="+2"
        trend="up"
        description="vs last week"
        chart={<div data-testid="chart" />}
        onClick={onClick}
      />,
    )

    const button = screen.getByRole('button', { name: 'Crews 24' })
    expect(button.children).toHaveLength(0)
    expect(button).not.toContainElement(screen.getByTestId('chart'))
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
    expect(ref.current).toContainElement(button)
    expect(button).toHaveAccessibleDescription(/favourable/)

    await user.click(button)
    button.focus()
    await user.keyboard('{Enter}')
    expect(onClick).toHaveBeenCalledTimes(2)

    expect(await axe(container)).toHaveNoViolations()
  })

  it('gives the button a caller’s aria-label instead of the card', () => {
    render(<StatsCard label="Crews" value="24" aria-label="Open crews" onClick={() => {}} />)
    expect(screen.getByRole('button', { name: 'Open crews' })).toBeInTheDocument()
  })
})

/* ----------------------------------------------------------- trend in words */

describe('trend text for assistive tech', () => {
  it('says whether a StatsCard change is good news', () => {
    render(
      <>
        <StatsCard label="Revenue" value="$1.4M" change="+12%" trend="up" />
        <StatsCard label="Refunds" value="31" change="+9" trend="down" />
        <StatsCard label="Tickets" value="12" change="0" trend="neutral" data-testid="neutral" />
      </>,
    )
    expect(screen.getByText(', favourable')).toHaveClass('sui-visually-hidden')
    expect(screen.getByText(', unfavourable')).toHaveClass('sui-visually-hidden')
    expect(screen.getByTestId('neutral').querySelector('.sui-visually-hidden')).toBeNull()
  })

  it('says whether a MetricTile delta is good news, in the caller’s words when given', () => {
    render(
      <>
        <MetricTile label="Churn" value="2%" delta="-0.4" trend="up" trendLabel="lower is better" />
        <MetricTile label="Late jobs" value="7" delta="+3" trend="down" />
      </>,
    )
    expect(screen.getByText(', lower is better')).toHaveClass('sui-visually-hidden')
    expect(screen.getByText(', unfavourable')).toHaveClass('sui-visually-hidden')
  })
})

/* ------------------------------------------------------------------ step card */

describe('step card heading level', () => {
  it('accepts h1', () => {
    render(<StepCard step={1} title="Intake" titleAs="h1" />)
    expect(screen.getByRole('heading', { level: 1, name: /Intake/ })).toBeInTheDocument()
  })
})

/* ---------------------------------------------------------------- status flow */

describe('status flow states and alternates', () => {
  it('names the alternates list and says which steps are still to come', () => {
    render(
      <StatusFlow
        label="Quote lifecycle"
        steps={['draft', 'sent', 'accepted']}
        alternates={['rejected']}
        current="sent"
      />,
    )
    expect(screen.getByRole('list', { name: 'Other outcomes' })).toBeInTheDocument()
    const [done, current, upcoming] = screen.getAllByRole('listitem')
    expect(done).toHaveTextContent('(done)')
    expect(current).not.toHaveTextContent('(')
    expect(upcoming).toHaveTextContent('(upcoming)')
  })

  it('takes its own words for the list name and the states', () => {
    render(
      <StatusFlow
        steps={['draft', 'sent']}
        alternates={['rejected']}
        alternatesListLabel="Failed outcomes"
        stateLabels={{ done: 'finished', upcoming: 'not yet' }}
        current={0}
      />,
    )
    expect(screen.getByRole('list', { name: 'Failed outcomes' })).toBeInTheDocument()
    expect(screen.getByText('(not yet)')).toBeInTheDocument()
  })
})
