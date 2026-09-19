/*
 * The navigation components added after 2.0.1: segmented control, stepper,
 * command menu, context menu, menubar, vertical navigation and the
 * navigation rail.
 */
import {
  Command,
  CommandMenu,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
  MenuShortcut,
  NavigationRail,
  NavigationRailItem,
  SegmentedControl,
  Stepper,
  VerticalNav,
  VerticalNavItem,
  VerticalNavSection,
  matchesShortcut,
  type CommandItem,
} from '@shining-technologies/ui'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'

/* ------------------------------------------------------- segmented control */

describe('SegmentedControl', () => {
  const options = [
    { value: 'list', label: 'List' },
    { value: 'board', label: 'Board' },
    { value: 'calendar', label: 'Calendar', disabled: true },
  ]

  it('is a radio group with the first option selected by default', async () => {
    const { container } = render(<SegmentedControl aria-label="View" options={options} />)
    expect(screen.getByRole('radiogroup', { name: 'View' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'List' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Board' })).not.toBeChecked()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('reports a click, and keeps a controlled value', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <SegmentedControl
        aria-label="View"
        options={options}
        value="board"
        onValueChange={onValueChange}
      />,
    )
    expect(screen.getByRole('radio', { name: 'Board' })).toBeChecked()
    await user.click(screen.getByRole('radio', { name: 'List' }))
    expect(onValueChange).toHaveBeenCalledWith('list')
    expect(screen.getByRole('radio', { name: 'Board' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Calendar' })).toBeDisabled()
  })

  it('names an icon-only segment from aria-label', () => {
    render(
      <SegmentedControl
        aria-label="Layout"
        options={[
          { value: 'grid', label: null, icon: '▦', 'aria-label': 'Grid' },
          { value: 'rows', label: null, icon: '≡', 'aria-label': 'Rows' },
        ]}
      />,
    )
    expect(screen.getByRole('radio', { name: 'Grid' })).toBeChecked()
  })
})

/* ------------------------------------------------------------------ stepper */

describe('Stepper', () => {
  const steps = [
    { id: 'cart', label: 'Cart' },
    { id: 'address', label: 'Address', description: '12 High St' },
    { id: 'payment', label: 'Payment' },
    { id: 'review', label: 'Review', optional: true },
  ]

  it('marks the current step and reads each status with its label', async () => {
    const { container } = render(<Stepper aria-label="Checkout" steps={steps} activeStep={2} />)
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(4)
    expect(items[2]).toHaveAttribute('aria-current', 'step')
    expect(items[0]).toHaveAttribute('data-status', 'complete')
    expect(items[3]).toHaveAttribute('data-status', 'upcoming')
    expect(items[0]).toHaveTextContent('Cart (Completed)')
    expect(items[2]).toHaveTextContent('Payment (Current)')
    expect(items[3]).toHaveTextContent('Optional')
    expect(await axe(container)).toHaveNoViolations()
  })

  it('makes only reached steps clickable when linear', async () => {
    const user = userEvent.setup()
    const onStepClick = vi.fn()
    render(<Stepper steps={steps} activeStep={2} onStepClick={onStepClick} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(2)
    await user.click(buttons[1]!)
    expect(onStepClick).toHaveBeenCalledWith(1, steps[1])
  })

  it('makes every step but the current one clickable when not linear', () => {
    render(<Stepper steps={steps} activeStep={1} onStepClick={() => {}} linear={false} />)
    expect(screen.getAllByRole('button')).toHaveLength(3)
  })

  it('lets a step report an error, with translatable labels', () => {
    render(
      <Stepper
        steps={[
          { id: 'a', label: 'Details', status: 'error' },
          { id: 'b', label: 'Done' },
        ]}
        activeStep={1}
        labels={{ error: 'Fehler' }}
      />,
    )
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('Details (Fehler)')
  })
})

/* ------------------------------------------------------------ command menu */

const commands: CommandItem[] = [
  { id: 'new-job', label: 'New job', group: 'Actions', keywords: ['create'] },
  { id: 'invite', label: 'Invite member', group: 'Actions', disabled: true },
  { id: 'jobs', label: 'Jobs', group: 'Go to' },
  { id: 'invoices', label: 'Invoices', group: 'Go to' },
]

describe('Command', () => {
  it('filters on label, group and keywords, and says when nothing matches', async () => {
    const user = userEvent.setup()
    render(<Command items={commands} emptyMessage="Nothing found" />)
    const input = screen.getByRole('combobox', { name: 'Search commands' })

    await user.type(input, 'create')
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['New job'])

    await user.clear(input)
    await user.type(input, 'go inv')
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Invoices'])

    await user.type(input, 'zzz')
    expect(screen.queryAllByRole('option')).toHaveLength(0)
    expect(screen.getByText('Nothing found')).toBeInTheDocument()
  })

  it('moves the highlight with the arrow keys, skipping disabled items, and runs it on Enter', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const itemSelect = vi.fn()
    render(
      <Command
        items={commands.map((c) => (c.id === 'jobs' ? { ...c, onSelect: itemSelect } : c))}
        onSelect={onSelect}
      />,
    )
    const input = screen.getByRole('combobox')
    await user.click(input)

    const highlighted = () =>
      document.getElementById(input.getAttribute('aria-activedescendant') ?? '')?.textContent
    expect(highlighted()).toBe('New job')
    await user.keyboard('{ArrowDown}')
    expect(highlighted()).toBe('Jobs')
    await user.keyboard('{ArrowUp}{ArrowUp}')
    expect(highlighted()).toBe('Invoices')
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}')

    expect(itemSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'jobs' }))
  })

  it('groups options under named groups, and passes axe', async () => {
    const { container } = render(<Command items={commands} />)
    expect(screen.getByRole('group', { name: 'Actions' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Go to' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Invite member' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('CommandMenu', () => {
  it('opens on mod+k, and closes after a choice', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<CommandMenu items={commands} onSelect={onSelect} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    const dialog = await screen.findByRole('dialog', { name: 'Command menu' })
    expect(dialog).toBeInTheDocument()

    await user.click(screen.getByRole('option', { name: 'Invoices' }))
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'invoices' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('does not bind a key when shortcut is false', () => {
    render(<CommandMenu items={commands} shortcut={false} />)
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('matchesShortcut', () => {
  const event = (
    key: string,
    mods: Partial<Record<'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey', boolean>> = {},
  ) => ({
    key,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    ...mods,
  })

  it('treats mod as either Cmd or Ctrl, and requires the exact extra modifiers', () => {
    expect(matchesShortcut(event('k', { metaKey: true }), 'mod+k')).toBe(true)
    expect(matchesShortcut(event('K', { ctrlKey: true }), 'mod+k')).toBe(true)
    expect(matchesShortcut(event('k'), 'mod+k')).toBe(false)
    expect(matchesShortcut(event('k', { ctrlKey: true, shiftKey: true }), 'mod+k')).toBe(false)
    expect(matchesShortcut(event('p', { ctrlKey: true, shiftKey: true }), 'ctrl+shift+p')).toBe(
      true,
    )
    expect(matchesShortcut(event('/'), '/')).toBe(true)
    expect(matchesShortcut(event('/', { ctrlKey: true }), '/')).toBe(false)
  })
})

/* ------------------------------------------------------ context menu, menubar */

describe('ContextMenu', () => {
  it('opens on right-click, with the shared menu row', async () => {
    const onSelect = vi.fn()
    render(
      <ContextMenu>
        <ContextMenuTrigger>Right-click here</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onSelect={onSelect}>
            Copy <MenuShortcut>⌘C</MenuShortcut>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    )
    fireEvent.contextMenu(screen.getByText('Right-click here'))
    const item = await screen.findByRole('menuitem', { name: /Copy/ })
    expect(item).toHaveClass('sui-menu__item')
    expect(screen.getByRole('menu')).toHaveClass('sui-menu--context')
    fireEvent.click(item)
    expect(onSelect).toHaveBeenCalled()
  })
})

describe('Menubar', () => {
  it('is a menubar whose triggers open menus', async () => {
    const user = userEvent.setup()
    render(
      <Menubar aria-label="Editor">
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>New</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Edit</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Undo</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    )
    expect(screen.getByRole('menubar', { name: 'Editor' })).toBeInTheDocument()
    await user.click(screen.getByRole('menuitem', { name: 'File' }))
    expect(await screen.findByRole('menuitem', { name: 'New' })).toBeInTheDocument()
  })
})

/* ------------------------------------------------------------ vertical nav */

describe('VerticalNav', () => {
  it('renders links, buttons and the current page', async () => {
    const { container } = render(
      <VerticalNav aria-label="Settings">
        <VerticalNavSection title="Account">
          <VerticalNavItem href="/profile" active>
            Profile
          </VerticalNavItem>
          <VerticalNavItem href="/billing" disabled>
            Billing
          </VerticalNavItem>
          <VerticalNavItem badge={3}>Notifications</VerticalNavItem>
        </VerticalNavSection>
      </VerticalNav>,
    )
    expect(screen.getByRole('navigation', { name: 'Settings' })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Account' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute('aria-current', 'page')
    // A disabled link loses its href, so it is no longer a link at all.
    expect(screen.queryByRole('link', { name: 'Billing' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Notifications 3' })).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('renders a router link with asChild, and forwards the ref', () => {
    const ref = createRef<HTMLElement>()
    render(
      <VerticalNav aria-label="Docs">
        <VerticalNavSection>
          <VerticalNavItem asChild active ref={ref}>
            <a href="/intro">Intro</a>
          </VerticalNavItem>
        </VerticalNavSection>
      </VerticalNav>,
    )
    const link = screen.getByRole('link', { name: 'Intro' })
    expect(link).toHaveClass('sui-vnav__item')
    expect(link).toHaveAttribute('aria-current', 'page')
    expect(ref.current).toBe(link)
  })
})

/* --------------------------------------------------------- navigation rail */

describe('NavigationRail', () => {
  it('is a navigation landmark whose items carry their badge in the name', async () => {
    const { container } = render(
      <NavigationRail>
        <NavigationRailItem icon="□" label="Inbox" badge={3} active />
        <NavigationRailItem icon="□" label="Jobs" href="/jobs" />
      </NavigationRail>,
    )
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument()
    const inbox = screen.getByRole('button', { name: /^Inbox\s+\(3\)$/ })
    expect(inbox).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Jobs' })).toHaveAttribute('href', '/jobs')
    expect(await axe(container)).toHaveNoViolations()
  })

  it('puts the icon and label inside an asChild link', () => {
    render(
      <NavigationRail aria-label="Apps">
        <NavigationRailItem asChild icon="□" label="Files">
          <a href="/files" />
        </NavigationRailItem>
      </NavigationRail>,
    )
    const link = screen.getByRole('link', { name: 'Files' })
    expect(link).toHaveClass('sui-rail__item')
    expect(link.querySelector('.sui-rail__label')).toHaveTextContent('Files')
  })
})
