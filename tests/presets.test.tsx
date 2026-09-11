import {
  BUILT_IN_PALETTES,
  applyBrand,
  darwindPalette,
  defaultPalette,
  paletteById,
  resolveProject,
  unnPalette,
} from '@shining-technologies/ui-kit-core'
import {
  Button,
  DataTable,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  UIKitProvider,
  useUIKit,
} from '@shining-technologies/ui-kit-react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { userColumns, users } from './fixtures'

afterEach(() => {
  document.documentElement.removeAttribute('style')
  document.documentElement.className = ''
  vi.restoreAllMocks()
})

const scopeOf = (container: HTMLElement) => container.querySelector<HTMLElement>('.sui-scope')!
const primaryOf = (id: string) => resolveProject(paletteById[id]!).light.colors!.primary!

function ProjectName() {
  return <span data-testid="project">{useUIKit().project.id}</span>
}

describe('shipped presets', () => {
  it('ships Darwind and Unn alongside the others', () => {
    const ids = BUILT_IN_PALETTES.map((p) => p.id)
    expect(ids).toContain('darwind')
    expect(ids).toContain('unn')
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gives Darwind and Unn their own colour, shape and type', () => {
    const d = darwindPalette
    const u = unnPalette
    expect(d.seed.primary).not.toBe(u.seed.primary)
    expect(d.seed.accent).not.toBe(u.seed.accent)
    expect(d.shape.radius).not.toBe(u.shape.radius)
    expect(d.shape.density).not.toBe(u.shape.density)
    expect(d.shape.elevation).not.toBe(u.shape.elevation)
    expect(d.shape.variant).not.toBe(u.shape.variant)
    expect(d.typography.titleFontWeight).not.toBe(u.typography.titleFontWeight)
  })

  it('does not duplicate any other preset’s brand colour', () => {
    const primaries = BUILT_IN_PALETTES.map((p) => p.seed.primary.toLowerCase())
    expect(new Set(primaries).size).toBe(primaries.length)
  })
})

describe('<UIKitProvider preset>', () => {
  it.each(BUILT_IN_PALETTES.map((p) => p.id))('resolves "%s" by id without a registry', (id) => {
    const { container } = render(
      <UIKitProvider preset={id} mode="light">
        <ProjectName />
      </UIKitProvider>,
    )
    expect(screen.getByTestId('project')).toHaveTextContent(id)
    expect(scopeOf(container).style.getPropertyValue('--sui-primary')).toBe(primaryOf(id))
  })

  it('also resolves a preset id passed to `project` and `defaultProject`', () => {
    render(
      <>
        <UIKitProvider project="unn">
          <ProjectName />
        </UIKitProvider>
        <UIKitProvider defaultProject="darwind">
          <ProjectName />
        </UIKitProvider>
      </>,
    )
    const [a, b] = screen.getAllByTestId('project')
    expect(a).toHaveTextContent('unn')
    expect(b).toHaveTextContent('darwind')
  })

  it('writes the preset’s shape, not only its colours', () => {
    const { container } = render(
      <UIKitProvider preset="unn" mode="light">
        <Button>Save</Button>
      </UIKitProvider>,
    )
    const scope = scopeOf(container)
    expect(scope.style.getPropertyValue('--sui-radius')).toBe('1.25rem')
    expect(scope).toHaveAttribute('data-sui-density', 'spacious')
    expect(scope.style.getPropertyValue('--sui-shadow-surface')).not.toBe('none')
  })

  it('follows a change to the preset prop', () => {
    const { container, rerender } = render(
      <UIKitProvider preset="darwind" mode="light">
        <ProjectName />
      </UIKitProvider>,
    )
    rerender(
      <UIKitProvider preset="unn" mode="light">
        <ProjectName />
      </UIKitProvider>,
    )
    expect(screen.getByTestId('project')).toHaveTextContent('unn')
    expect(scopeOf(container).style.getPropertyValue('--sui-primary')).toBe(primaryOf('unn'))
  })

  it('warns about an unknown id instead of failing silently', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(
      <UIKitProvider preset="darwnid">
        <ProjectName />
      </UIKitProvider>,
    )
    expect(screen.getByTestId('project')).toHaveTextContent(defaultPalette.id)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('preset="darwnid"'))
  })
})

describe('<UIKitProvider brand>', () => {
  it('takes a bare colour as the primary', () => {
    const { container } = render(
      <UIKitProvider brand="#be123c" mode="light">
        <ProjectName />
      </UIKitProvider>,
    )
    const expected = resolveProject(applyBrand(defaultPalette, '#be123c')).light.colors!.primary
    expect(scopeOf(container).style.getPropertyValue('--sui-primary')).toBe(expected)
  })

  it('tweaks a preset while keeping everything it does not mention', () => {
    const { container } = render(
      <UIKitProvider preset="darwind" brand={{ primary: '#be123c', radius: '0.5rem' }} mode="light">
        <ProjectName />
      </UIKitProvider>,
    )
    const scope = scopeOf(container)
    expect(scope.style.getPropertyValue('--sui-radius')).toBe('0.5rem')
    // Density and the rest of the seed come from Darwind untouched.
    expect(scope).toHaveAttribute('data-sui-density', 'compact')
    const expected = resolveProject(applyBrand(darwindPalette, { primary: '#be123c' })).light
    expect(scope.style.getPropertyValue('--sui-primary')).toBe(expected.colors!.primary)
    expect(scope.style.getPropertyValue('--sui-chart-2')).toBe(expected.colors!.chart2)
    expect(screen.getByTestId('project')).toHaveTextContent('darwind-custom')
  })

  it('never mutates the shipped preset', () => {
    applyBrand(unnPalette, { primary: '#000000', radius: '0px' })
    expect(unnPalette.seed.primary).toBe('#0f766e')
    expect(unnPalette.shape.radius).toBe('1.25rem')
  })

  it('lets an explicit project win over preset and brand', () => {
    render(
      <UIKitProvider project="unn" preset="darwind" brand="#be123c">
        <ProjectName />
      </UIKitProvider>,
    )
    expect(screen.getByTestId('project')).toHaveTextContent('unn')
  })
})

describe('a preset reaches every component', () => {
  it('gives tables the preset’s density and table style', () => {
    const { container } = render(
      <UIKitProvider preset="darwind">
        <DataTable data={users} columns={userColumns} label="Users" />
      </UIKitProvider>,
    )
    const root = container.querySelector('.sui-root')!
    expect(root).toHaveAttribute('data-density', 'compact')
    expect(root).toHaveAttribute('data-variant', 'striped')
  })

  it('still lets a table override the preset', () => {
    const { container } = render(
      <UIKitProvider preset="darwind">
        <DataTable data={users} columns={userColumns} label="Users" density="spacious" />
      </UIKitProvider>,
    )
    expect(container.querySelector('.sui-root')).toHaveAttribute('data-density', 'spacious')
  })

  it('keeps the old default for a table with no provider', () => {
    const { container } = render(<DataTable data={users} columns={userColumns} label="Users" />)
    const root = container.querySelector('.sui-root')!
    expect(root).toHaveAttribute('data-density', 'comfortable')
    expect(root).toHaveAttribute('data-variant', 'default')
  })

  it('renders dialogs inside the themed scope in local scope', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <UIKitProvider preset="unn">
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Themed</DialogTitle>
          </DialogContent>
        </Dialog>
      </UIKitProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Open' }))
    const dialog = await screen.findByRole('dialog')
    expect(scopeOf(container).contains(dialog)).toBe(true)
  })

  it('renders menus inside the themed scope in local scope', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <UIKitProvider preset="darwind">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>Menu</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Rename</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </UIKitProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Menu' }))
    const item = await screen.findByRole('menuitem', { name: 'Rename' })
    expect(scopeOf(container).contains(item)).toBe(true)
  })

  it('gives <html> the base scope in global scope, and takes it back on unmount', () => {
    const { unmount } = render(
      <UIKitProvider preset="unn" scope="global">
        <Button>Save</Button>
      </UIKitProvider>,
    )
    const root = document.documentElement
    expect(root.classList.contains('sui-scope')).toBe(true)
    expect(root).toHaveAttribute('data-sui-project', 'unn')
    expect(root.style.getPropertyValue('--sui-radius')).toBe('1.25rem')

    unmount()
    expect(root.classList.contains('sui-scope')).toBe(false)
  })
})
