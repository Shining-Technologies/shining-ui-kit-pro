import {
  BUILT_IN_PALETTES,
  ProjectRegistry,
  contrastRatio,
  createProject,
  resolveProject,
  shiningPalette,
  type ProjectStorage,
} from '@shining-ui-kit/core'
import {
  Button,
  Card,
  CardContent,
  ColorModeToggle,
  ProjectSwitcher,
  UIKitProvider,
  useUIKit,
} from '@shining-ui-kit/react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

/** An in-memory stand-in for localStorage, so tests never touch the real one. */
function memoryStorage(): ProjectStorage & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  }
}

afterEach(() => {
  document.documentElement.removeAttribute('style')
  document.documentElement.className = ''
})

describe('generated palettes', () => {
  /**
   * The contract that makes "pick any brand colour" safe. If a future change to
   * the generator lets a seed produce an unreadable pair, this fails rather than
   * the failure reaching a user's screen.
   */
  it.each(BUILT_IN_PALETTES.map((p) => [p.id, p] as const))(
    '%s keeps every text/background pair at WCAG AA in both modes',
    (_id, palette) => {
      const resolved = resolveProject(palette)

      for (const mode of ['light', 'dark'] as const) {
        const c = resolved[mode].colors!
        const pairs: [string, string, string][] = [
          ['body', c.foreground!, c.background!],
          ['card', c.cardForeground!, c.card!],
          ['popover', c.popoverForeground!, c.popover!],
          ['primary', c.primaryForeground!, c.primary!],
          ['secondary', c.secondaryForeground!, c.secondary!],
          ['muted on card', c.mutedForeground!, c.card!],
          ['muted on muted', c.mutedForeground!, c.muted!],
          ['accent', c.accentForeground!, c.accent!],
          ['destructive', c.destructiveForeground!, c.destructive!],
          ['success', c.successForeground!, c.success!],
          ['warning', c.warningForeground!, c.warning!],
          ['info', c.infoForeground!, c.info!],
          ['table header', c.headerForeground!, c.headerBackground!],
          ['selected row', c.rowForeground!, c.rowSelected!],
        ]

        for (const [label, foreground, background] of pairs) {
          const ratio = contrastRatio(foreground, background)
          expect(`${mode}/${label}: ${ratio.toFixed(2)}`).toBe(
            `${mode}/${label}: ${Math.max(ratio, 4.5).toFixed(2)}`,
          )
        }
      }
    },
  )

  it('holds an arbitrary custom brand colour to the same standard', () => {
    // Mid-lightness seeds are the hard case: neither white nor black reaches
    // 4.5:1 against them without the fill being moved.
    for (const primary of ['#e11d48', '#38bdf8', '#facc15', '#7c3aed', '#14b8a6', '#f97316']) {
      const project = createProject({ name: 'Custom', seed: { primary } })
      for (const mode of ['light', 'dark'] as const) {
        const c = resolveProject(project)[mode].colors!
        expect(contrastRatio(c.primaryForeground!, c.primary!)).toBeGreaterThanOrEqual(4.5)
      }
    }
  })

  it('gives every project five distinguishable chart colours', () => {
    for (const palette of BUILT_IN_PALETTES) {
      const c = resolveProject(palette).light.colors!
      const charts = [c.chart1!, c.chart2!, c.chart3!, c.chart4!, c.chart5!]
      expect(new Set(charts).size).toBe(5)
      // Neighbouring series must separate in lightness, which is what keeps
      // them apart in greyscale and for a colour-blind reader.
      for (let i = 1; i < charts.length; i++) {
        expect(contrastRatio(charts[i - 1]!, charts[i]!)).toBeGreaterThan(1.2)
      }
    }
  })

  it('reproduces the Shining portal palette from its own seeds', () => {
    const light = resolveProject(shiningPalette).light.colors!
    expect(light.primary).toBe('#01493b')
    expect(light.background).toBe('#fafaf7')
    expect(light.card).toBe('#ffffff')
  })
})

describe('<UIKitProvider>', () => {
  it('writes the project as CSS variables on a scoped wrapper', () => {
    const { container } = render(
      <UIKitProvider project={shiningPalette} mode="light">
        <Button>Save</Button>
      </UIKitProvider>,
    )

    const scope = container.querySelector<HTMLElement>('.sui-scope')!
    expect(scope.style.getPropertyValue('--sui-primary')).toBe('#01493b')
    expect(scope.style.getPropertyValue('--sui-background')).toBe('#fafaf7')
    expect(scope).toHaveAttribute('data-sui-project', 'shining')
    expect(scope).toHaveAttribute('data-sui-density', 'comfortable')
  })

  it('writes onto the document root in global scope, so portals inherit them', () => {
    const { unmount } = render(
      <UIKitProvider project={shiningPalette} mode="dark" scope="global">
        <Button>Save</Button>
      </UIKitProvider>,
    )

    const root = document.documentElement
    expect(root.style.getPropertyValue('--sui-primary')).toBeTruthy()
    expect(root).toHaveAttribute('data-sui-mode', 'dark')
    expect(root.classList.contains('dark')).toBe(true)

    // Leaving the variables behind would silently theme the next page.
    unmount()
    expect(root.style.getPropertyValue('--sui-primary')).toBe('')
    expect(root.classList.contains('dark')).toBe(false)
  })

  it('repaints every component when the project changes', async () => {
    const user = userEvent.setup()

    function Harness() {
      const { project } = useUIKit()
      return (
        <Card>
          <CardContent>
            <span data-testid="name">{project.name}</span>
          </CardContent>
        </Card>
      )
    }

    const registry = new ProjectRegistry({ storage: memoryStorage() })
    const { container } = render(
      <UIKitProvider registry={registry} defaultProject="shining" mode="light">
        <ProjectSwitcher />
        <Harness />
      </UIKitProvider>,
    )

    const scope = container.querySelector<HTMLElement>('.sui-scope')!
    expect(scope.style.getPropertyValue('--sui-primary')).toBe('#01493b')
    expect(screen.getByTestId('name')).toHaveTextContent('Shining')

    await user.click(screen.getByRole('button', { name: /Project: Shining/ }))
    await user.click(await screen.findByRole('menuitem', { name: /Violet/ }))

    await waitFor(() => expect(screen.getByTestId('name')).toHaveTextContent('Violet'))
    expect(scope.style.getPropertyValue('--sui-primary')).not.toBe('#01493b')
  })

  it('swaps the whole palette when the colour mode changes', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <UIKitProvider project={shiningPalette} defaultMode="light">
        <ColorModeToggle modes={['light', 'dark']} />
      </UIKitProvider>,
    )

    const scope = container.querySelector<HTMLElement>('.sui-scope')!
    const lightBackground = scope.style.getPropertyValue('--sui-background')

    await user.click(screen.getByRole('radio', { name: 'Dark' }))

    await waitFor(() =>
      expect(scope.style.getPropertyValue('--sui-background')).not.toBe(lightBackground),
    )
    expect(scope).toHaveAttribute('data-sui-mode', 'dark')
  })
})

describe('ProjectRegistry', () => {
  it('creates, updates and deletes user projects', () => {
    const registry = new ProjectRegistry({ storage: memoryStorage() })
    const created = registry.create({ name: 'Acme', seed: { primary: '#7c3aed' } })

    expect(registry.get(created.id)).toBeDefined()
    expect(registry.list().filter((p) => !p.builtIn)).toHaveLength(1)

    const updated = registry.update(created.id, { seed: { primary: '#0ea5e9' } })
    expect(updated.seed.primary).toBe('#0ea5e9')
    expect(updated.id).toBe(created.id)

    expect(registry.remove(created.id)).toBe(true)
    expect(registry.get(created.id)).toBeUndefined()
  })

  it('forks a built-in rather than mutating the shipped preset', () => {
    const registry = new ProjectRegistry({ storage: memoryStorage() })
    const forked = registry.update('shining', { seed: { primary: '#ff0000' } })

    expect(forked.id).not.toBe('shining')
    expect(forked.builtIn).toBe(false)
    expect(forked.basePalette).toBe('shining')
    // The preset is still available, untouched.
    expect(registry.get('shining')!.seed.primary).toBe('#01493b')
  })

  it('refuses to delete a built-in', () => {
    const registry = new ProjectRegistry({ storage: memoryStorage() })
    expect(registry.remove('shining')).toBe(false)
    expect(registry.get('shining')).toBeDefined()
  })

  it('keeps ids unique so two projects can share a name', () => {
    const registry = new ProjectRegistry({ storage: memoryStorage() })
    const a = registry.create({ name: 'Acme', seed: { primary: '#111111' } })
    const b = registry.create({ name: 'Acme', seed: { primary: '#222222' } })
    expect(a.id).not.toBe(b.id)
  })

  it('persists user projects and the active id across a reload', () => {
    const storage = memoryStorage()
    const first = new ProjectRegistry({ storage })
    const created = first.create({ name: 'Acme', seed: { primary: '#7c3aed' } })
    first.setActive(created.id)

    const second = new ProjectRegistry({ storage })
    expect(second.getActiveId()).toBe(created.id)
    expect(second.get(created.id)?.seed.primary).toBe('#7c3aed')
  })

  it('survives unreadable storage instead of taking the app down', () => {
    const broken: ProjectStorage = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('quota')
      },
      removeItem: () => {},
    }
    const registry = new ProjectRegistry({ storage: broken })
    expect(() => registry.create({ name: 'Acme', seed: { primary: '#111111' } })).not.toThrow()
    expect(registry.list().length).toBeGreaterThan(BUILT_IN_PALETTES.length - 1)
  })

  it('round-trips through export and import', () => {
    const source = new ProjectRegistry({ storage: memoryStorage() })
    source.create({ name: 'Acme', seed: { primary: '#7c3aed' } })

    const target = new ProjectRegistry({ storage: memoryStorage() })
    const imported = target.import(source.export())

    expect(imported).toHaveLength(1)
    expect(imported[0]!.seed.primary).toBe('#7c3aed')
  })

  it('rejects junk rather than partially applying it', () => {
    const registry = new ProjectRegistry({ storage: memoryStorage() })
    expect(() => registry.import('not json')).toThrow()
    expect(registry.list().filter((p) => !p.builtIn)).toHaveLength(0)
  })
})
