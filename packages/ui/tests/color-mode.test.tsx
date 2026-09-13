/*
 * Colour mode without a provider: `.dark` on <html>, a stored preference, and
 * the pre-paint script. Replaces V1's `UIKitProvider` mode tests
 * (`tests/theming.test.tsx` "swaps the whole palette when the colour mode
 * changes", "writes onto the document root in global scope").
 */
import {
  ColorModeToggle,
  DEFAULT_COLOR_MODE_STORAGE_KEY,
  getColorModeScript,
  useColorMode,
} from '@shining-technologies/ui'
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const KEY = 'sui-color-mode'
const root = () => document.documentElement

const originalMatchMedia = window.matchMedia

/** Pretend the operating system prefers `dark` (or not); returns a function that flips it live. */
function stubSystem(dark: boolean) {
  let matches = dark
  const listeners = new Set<(event: { matches: boolean }) => void>()
  const matchMedia = (query: string) => ({
    get matches() {
      return query.includes('dark') ? matches : false
    },
    media: query,
    onchange: null,
    addEventListener: (_type: string, listener: (event: { matches: boolean }) => void) => listeners.add(listener),
    removeEventListener: (_type: string, listener: (event: { matches: boolean }) => void) =>
      listeners.delete(listener),
    addListener: (listener: (event: { matches: boolean }) => void) => listeners.add(listener),
    removeListener: (listener: (event: { matches: boolean }) => void) => listeners.delete(listener),
    dispatchEvent: () => true,
  })
  Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: matchMedia })
  return (next: boolean) => {
    matches = next
    for (const listener of [...listeners]) listener({ matches: next })
  }
}

function reset() {
  root().className = ''
  root().removeAttribute('style')
  window.localStorage.clear()
}

beforeEach(() => {
  reset()
  stubSystem(false)
})

afterEach(() => {
  reset()
  Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: originalMatchMedia })
  vi.restoreAllMocks()
})

describe('<ColorModeToggle>', () => {
  it('uses the documented storage key', () => {
    expect(DEFAULT_COLOR_MODE_STORAGE_KEY).toBe(KEY)
  })

  it('toggles .dark on <html>, persists the choice and renames itself', async () => {
    const user = userEvent.setup()
    render(<ColorModeToggle />)

    const button = screen.getByRole('button', { name: 'Switch to dark mode' })
    expect(root().classList.contains('dark')).toBe(false)

    await user.click(button)
    expect(root().classList.contains('dark')).toBe(true)
    expect(root().style.colorScheme).toBe('dark')
    expect(window.localStorage.getItem(KEY)).toBe('dark')
    expect(button).toHaveAccessibleName('Switch to light mode')
    expect(button).toHaveAttribute('data-mode', 'dark')

    await user.click(button)
    expect(root().classList.contains('dark')).toBe(false)
    expect(root().style.colorScheme).toBe('light')
    expect(window.localStorage.getItem(KEY)).toBe('light')
    expect(button).toHaveAccessibleName('Switch to dark mode')
  })

  it('starts from a stored preference', () => {
    window.localStorage.setItem(KEY, 'dark')
    render(<ColorModeToggle />)
    expect(screen.getByRole('button')).toHaveAccessibleName('Switch to light mode')
  })

  it('follows the operating system when the preference is system', () => {
    stubSystem(true)
    render(<ColorModeToggle defaultMode="system" />)
    expect(screen.getByRole('button')).toHaveAccessibleName('Switch to light mode')
  })

  it('honours a custom storage key and labels', async () => {
    const user = userEvent.setup()
    render(<ColorModeToggle storageKey="acme-mode" labels={{ toDark: 'Lights off', toLight: 'Lights on' }} />)
    await user.click(screen.getByRole('button', { name: 'Lights off' }))
    expect(window.localStorage.getItem('acme-mode')).toBe('dark')
    expect(window.localStorage.getItem(KEY)).toBeNull()
    expect(screen.getByRole('button')).toHaveAccessibleName('Lights on')
  })

  it('only reports clicks when controlled, leaving <html> and storage alone', async () => {
    const user = userEvent.setup()
    const onModeChange = vi.fn()
    const { rerender } = render(<ColorModeToggle mode="light" onModeChange={onModeChange} />)

    await user.click(screen.getByRole('button', { name: 'Switch to dark mode' }))
    expect(onModeChange).toHaveBeenCalledWith('dark')
    expect(root().classList.contains('dark')).toBe(false)
    expect(window.localStorage.getItem(KEY)).toBeNull()
    // Still whatever the owner says it is.
    expect(screen.getByRole('button')).toHaveAccessibleName('Switch to dark mode')

    rerender(<ColorModeToggle mode="dark" onModeChange={onModeChange} />)
    await user.click(screen.getByRole('button', { name: 'Switch to light mode' }))
    expect(onModeChange).toHaveBeenLastCalledWith('light')
    expect(root().classList.contains('dark')).toBe(false)
    expect(window.localStorage.getItem(KEY)).toBeNull()
  })

  it('survives blocked storage', async () => {
    const user = userEvent.setup()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    render(<ColorModeToggle />)
    await user.click(screen.getByRole('button'))
    expect(root().classList.contains('dark')).toBe(true)
  })
})

describe('useColorMode', () => {
  function Probe({ id }: { id: string }) {
    const { mode, resolvedMode, setMode } = useColorMode()
    return (
      <div>
        <span data-testid={`${id}-mode`}>{mode}</span>
        <span data-testid={`${id}-resolved`}>{resolvedMode}</span>
        <button type="button" onClick={() => setMode('dark')}>
          {id} dark
        </button>
        <button type="button" onClick={() => setMode('system')}>
          {id} system
        </button>
      </div>
    )
  }

  it('keeps two components in sync without a provider', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Probe id="a" />
        <Probe id="b" />
        <ColorModeToggle />
      </>,
    )
    expect(screen.getByTestId('b-mode')).toHaveTextContent('system')
    expect(screen.getByTestId('b-resolved')).toHaveTextContent('light')

    await user.click(screen.getByRole('button', { name: 'a dark' }))
    expect(screen.getByTestId('a-mode')).toHaveTextContent('dark')
    expect(screen.getByTestId('b-mode')).toHaveTextContent('dark')
    expect(screen.getByTestId('b-resolved')).toHaveTextContent('dark')
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Switch to light mode' }))
    expect(screen.getByTestId('a-mode')).toHaveTextContent('light')
    expect(screen.getByTestId('b-resolved')).toHaveTextContent('light')
  })

  it('follows a change made in another tab', () => {
    render(<Probe id="a" />)
    act(() => {
      window.localStorage.setItem(KEY, 'dark')
      window.dispatchEvent(new StorageEvent('storage', { key: KEY }))
    })
    expect(screen.getByTestId('a-mode')).toHaveTextContent('dark')
    expect(root().classList.contains('dark')).toBe(true)
  })

  it('follows the operating system live while the preference is system', () => {
    const flip = stubSystem(false)
    render(<Probe id="a" />)
    expect(screen.getByTestId('a-resolved')).toHaveTextContent('light')
    act(() => flip(true))
    expect(screen.getByTestId('a-resolved')).toHaveTextContent('dark')
    expect(root().classList.contains('dark')).toBe(true)
  })

  it('ignores junk in storage', () => {
    window.localStorage.setItem(KEY, 'purple')
    render(<Probe id="a" />)
    expect(screen.getByTestId('a-mode')).toHaveTextContent('system')
    fireEvent.click(screen.getByRole('button', { name: 'a dark' }))
    expect(screen.getByTestId('a-mode')).toHaveTextContent('dark')
  })
})

describe('getColorModeScript', () => {
  const run = (options?: Parameters<typeof getColorModeScript>[0]) => new Function(getColorModeScript(options))()

  it('adds .dark before paint for a stored dark preference', () => {
    window.localStorage.setItem(KEY, 'dark')
    run()
    expect(root().classList.contains('dark')).toBe(true)
    expect(root().style.colorScheme).toBe('dark')
  })

  it('removes .dark for a stored light preference', () => {
    root().classList.add('dark')
    window.localStorage.setItem(KEY, 'light')
    stubSystem(true)
    run()
    expect(root().classList.contains('dark')).toBe(false)
    expect(root().style.colorScheme).toBe('light')
  })

  it('follows matchMedia for system, stored or by default', () => {
    stubSystem(true)
    run()
    expect(root().classList.contains('dark')).toBe(true)

    reset()
    stubSystem(false)
    window.localStorage.setItem(KEY, 'system')
    run()
    expect(root().classList.contains('dark')).toBe(false)

    stubSystem(true)
    run()
    expect(root().classList.contains('dark')).toBe(true)
  })

  it('uses defaultMode when nothing valid is stored', () => {
    stubSystem(false)
    run({ defaultMode: 'dark' })
    expect(root().classList.contains('dark')).toBe(true)

    window.localStorage.setItem(KEY, 'purple')
    run({ defaultMode: 'light' })
    expect(root().classList.contains('dark')).toBe(false)
  })

  it('reads a custom storage key', () => {
    window.localStorage.setItem('acme-mode', 'dark')
    run({ storageKey: 'acme-mode' })
    expect(root().classList.contains('dark')).toBe(true)
  })

  it('does not throw when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => run({ defaultMode: 'dark' })).not.toThrow()
    expect(root().classList.contains('dark')).toBe(true)
  })

  it('treats a hostile storage key as data, not code', () => {
    const storageKey = '");document.documentElement.classList.add("pwned");("'
    expect(() => run({ storageKey })).not.toThrow()
    expect(root().classList.contains('pwned')).toBe(false)
  })

  it('agrees with the hook about what is painted', () => {
    window.localStorage.setItem(KEY, 'dark')
    run()
    const painted = root().classList.contains('dark')
    render(<ColorModeToggle />)
    expect(screen.getByRole('button')).toHaveAttribute('data-mode', painted ? 'dark' : 'light')
  })
})

describe('without ColorModeScript', () => {
  function ModeProbe() {
    const { resolvedMode } = useColorMode()
    return <span data-testid="resolved">{resolvedMode}</span>
  }

  it('applies the stored preference to <html> on mount', () => {
    window.localStorage.setItem(KEY, 'dark')
    render(<ModeProbe />)
    expect(root().classList.contains('dark')).toBe(true)
    expect(root().style.colorScheme).toBe('dark')
  })

  it('corrects <html> from an uncontrolled toggle too', () => {
    window.localStorage.setItem(KEY, 'light')
    root().classList.add('dark')
    render(<ColorModeToggle />)
    expect(root().classList.contains('dark')).toBe(false)
    expect(screen.getByRole('button')).toHaveAccessibleName('Switch to dark mode')
  })
})

describe('<ColorModeToggle> controlled by next-themes', () => {
  it('leaves <html> alone on mount', () => {
    window.localStorage.setItem(KEY, 'dark')
    render(<ColorModeToggle mode="light" onModeChange={() => {}} />)
    expect(root().classList.contains('dark')).toBe(false)
  })

  it('stays controlled while mode is still undefined, with a neutral name', async () => {
    const user = userEvent.setup()
    const onModeChange = vi.fn()
    render(<ColorModeToggle mode={undefined} onModeChange={onModeChange} />)

    const button = screen.getByRole('button', { name: 'Toggle colour mode' })
    expect(button).not.toHaveAttribute('data-mode')
    await user.click(button)
    expect(onModeChange).toHaveBeenCalledWith('dark')
    expect(window.localStorage.getItem(KEY)).toBeNull()
    expect(root().classList.contains('dark')).toBe(false)
  })

  it('flips whatever is painted when clicked before the mode is known', async () => {
    const user = userEvent.setup()
    const onModeChange = vi.fn()
    root().classList.add('dark')
    render(<ColorModeToggle mode={undefined} onModeChange={onModeChange} labels={{ toggle: 'Theme' }} />)
    await user.click(screen.getByRole('button', { name: 'Theme' }))
    expect(onModeChange).toHaveBeenCalledWith('light')
    expect(root().classList.contains('dark')).toBe(true)
  })

  it('does not follow an OS change onto <html>', () => {
    window.localStorage.setItem(KEY, 'system')
    const flip = stubSystem(false)
    render(<ColorModeToggle mode="light" onModeChange={() => {}} />)
    act(() => flip(true))
    expect(root().classList.contains('dark')).toBe(false)
  })

  it('still switches by itself when only onModeChange is passed', async () => {
    const user = userEvent.setup()
    const onModeChange = vi.fn()
    render(<ColorModeToggle onModeChange={onModeChange} />)
    await user.click(screen.getByRole('button', { name: 'Switch to dark mode' }))
    expect(onModeChange).toHaveBeenCalledWith('dark')
    expect(window.localStorage.getItem(KEY)).toBe('dark')
    expect(root().classList.contains('dark')).toBe(true)
  })
})
