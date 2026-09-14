/*
 * Regression tests for the defects found by the documentation review before
 * 2.0.0: places where the code did not do what its own comments, types or
 * guarantees said. One `describe` per defect.
 */
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import {
  applyQuery,
  DataTable,
  Field,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Tooltip,
  TooltipProvider,
  type ColumnDef,
} from '@shining-technologies/ui'
import { Sparkline } from '@shining-technologies/ui/charts'
import { contrastRatio, createTheme } from '@shining-technologies/ui/theme'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { users, type User } from './fixtures'

const PKG = resolve(__dirname, '..')
const read = (path: string) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n')
const bodyRows = () => document.querySelectorAll('tbody tr[data-sui-row]')

describe('a column with enableFiltering: false', () => {
  it('ignores a filter set in code in a client-mode table, as applyQuery does', () => {
    const filters = [{ id: 'role', value: 'admin' }]
    const columns = (enableFiltering: boolean): ColumnDef<User>[] => [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'role', header: 'Role', enableFiltering },
    ]

    const { unmount } = render(
      <DataTable data={users} columns={columns(true)} defaultColumnFilters={filters} />,
    )
    expect(bodyRows()).toHaveLength(2)
    unmount()

    render(<DataTable data={users} columns={columns(false)} defaultColumnFilters={filters} />)
    expect(bodyRows()).toHaveLength(users.length)
    const page = applyQuery(
      users,
      { pageIndex: 0, pageSize: 10, columnFilters: filters },
      { columns: columns(false) },
    )
    expect(page.total).toBe(users.length)
  })
})

describe('filter.defaultOperator in the filter panel', () => {
  it('preselects the operator and writes the first value with it', async () => {
    const user = userEvent.setup()
    const onColumnFiltersChange = vi.fn()
    render(
      <DataTable
        data={users}
        columns={[
          { accessorKey: 'name', header: 'Name' },
          { accessorKey: 'role', header: 'Role', filter: { type: 'text', defaultOperator: 'startsWith' } },
        ]}
        filterLayout="panel"
        onColumnFiltersChange={onColumnFiltersChange}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Filters, none active' }))
    expect(await screen.findByRole('combobox', { name: 'Role condition' })).toHaveTextContent(
      'starts with',
    )
    await user.type(screen.getByRole('textbox', { name: 'Role value' }), 'ad')
    await waitFor(() => {
      const filters = onColumnFiltersChange.mock.lastCall?.[0] ?? []
      expect(filters[0]?.value).toEqual({ operator: 'startsWith', value: 'ad' })
    })
  })
})

describe('select filter options', () => {
  it('honour disabled', async () => {
    const user = userEvent.setup()
    render(
      <DataTable
        data={users}
        columns={[
          { accessorKey: 'name', header: 'Name' },
          {
            accessorKey: 'role',
            header: 'Role',
            filter: {
              type: 'select',
              options: [
                { label: 'Admin', value: 'admin' },
                { label: 'Viewer', value: 'viewer', disabled: true },
              ],
            },
          },
        ]}
        filterLayout="inline"
      />,
    )

    await user.click(screen.getByRole('combobox', { name: 'Role filter' }))
    expect(await screen.findByRole('option', { name: 'Viewer' })).toHaveAttribute('data-disabled')
    expect(screen.getByRole('option', { name: 'Admin' })).not.toHaveAttribute('data-disabled')
  })
})

describe('Sparkline with a style prop', () => {
  it('keeps its height', () => {
    const { container } = render(<Sparkline data={[1, 3, 2]} style={{ width: 96 }} />)
    const box = container.querySelector<HTMLElement>('.sui-viz__sparkline')!
    expect(box.style.width).toBe('96px')
    expect(box.style.height).toBe('40px')
  })

  it('lets style set the height explicitly', () => {
    const { container } = render(<Sparkline data={[1, 3, 2]} height={40} style={{ height: 24 }} />)
    expect(container.querySelector<HTMLElement>('.sui-viz__sparkline')!.style.height).toBe('24px')
  })
})

describe('spinner under prefers-reduced-motion', () => {
  it('keeps pulsing past the kit-wide reduced-motion rule', () => {
    const surfaces = read(join(PKG, 'src', 'styles', 'surfaces.css'))
    const block = surfaces.slice(surfaces.indexOf('animation: sui-pulse 1.4s'))
    expect(block).toMatch(/^[^}]*animation-iteration-count: infinite !important/)
    expect(read(join(PKG, 'src', 'styles', 'base.css'))).toContain(
      'animation-iteration-count: 1 !important',
    )
    // Same layer and specificity, so bundle order decides: surfaces must follow base.
    const build = read(join(PKG, 'scripts', 'build-css.mjs'))
    expect(build.indexOf("'surfaces'")).toBeGreaterThan(build.indexOf("'base'"))
  })
})

describe('the dark-mode input border', () => {
  it.each(['#01493b', '#e11d48', '#2563eb', '#facc15', '#7c3aed', '#737373'])(
    'clears 3:1 against the card, as in light mode (%s)',
    (primary) => {
      for (const neutralTint of ['pure', 'subtle', 'tinted'] as const) {
        const { dark } = createTheme({ primary, neutralTint })
        expect(contrastRatio(dark['--input']!, dark['--card']!)).toBeGreaterThanOrEqual(3)
      }
    },
  )
})

describe('disabled controls in a form', () => {
  const data = () => new FormData(screen.getByTestId('form') as HTMLFormElement)

  it('leave a disabled Slider out of the form data', () => {
    render(
      <form data-testid="form">
        <Slider name="enabled" defaultValue={[40]} aria-label="Enabled" />
        <Slider name="off" disabled defaultValue={[20]} aria-label="Off" />
        <Field label="Budget" disabled>
          <Slider name="field" defaultValue={[30]} />
        </Field>
      </form>,
    )
    expect(data().get('enabled')).toBe('40')
    expect(data().has('off')).toBe(false)
    expect(data().has('field')).toBe(false)
  })

  it('leave a Select disabled by its Field out of the form data', () => {
    const region = (name: string) => (
      <Select name={name} defaultValue="syd">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="syd">Sydney</SelectItem>
        </SelectContent>
      </Select>
    )
    render(
      <form data-testid="form">
        <Field label="Region">{region('on')}</Field>
        <Field label="Old region" disabled>
          {region('off')}
        </Field>
      </form>,
    )
    expect(data().get('on')).toBe('syd')
    expect(data().has('off')).toBe(false)
    expect(screen.getByRole('combobox', { name: 'Old region' })).toBeDisabled()
  })
})

describe('TooltipProvider without delayDuration', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('opens after the same 300ms a standalone Tooltip uses, not Radix’s 700ms', () => {
    vi.useFakeTimers()
    render(
      <TooltipProvider>
        <Tooltip content="Later">
          <button type="button">Trigger</button>
        </Tooltip>
      </TooltipProvider>,
    )
    fireEvent.pointerMove(screen.getByRole('button', { name: 'Trigger' }), { pointerType: 'mouse' })
    act(() => vi.advanceTimersByTime(250))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    act(() => vi.advanceTimersByTime(100))
    expect(screen.queryByRole('tooltip')).toBeInTheDocument()
  })
})
