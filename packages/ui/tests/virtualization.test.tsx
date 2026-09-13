import { VirtualizedDataTable } from '@shining-technologies/ui/virtualized'
import { act, render, screen, waitFor } from '@testing-library/react'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { makeUsers, userColumns } from './fixtures'

const manyRows = makeUsers(5_000)

const bodyRows = () => document.querySelectorAll('tbody tr[data-sui-row]')

/**
 * Give the DOM real dimensions.
 *
 * Virtualization is arithmetic over measurements, and a headless DOM reports
 * zero for all of them — so without this every element is considered invisible
 * and nothing renders.
 */
const VIEWPORT = 400
const ROW = 48
let restore: Array<() => void> = []

beforeAll(() => {
  const originalRect = Element.prototype.getBoundingClientRect
  Element.prototype.getBoundingClientRect = function measured(this: Element) {
    const isScroller = this instanceof HTMLElement && this.hasAttribute('data-sui-scroll')
    const height = isScroller ? VIEWPORT : ROW
    return {
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 800,
      bottom: height,
      width: 800,
      height,
      toJSON: () => ({}),
    } as DOMRect
  }
  const descriptors = ['offsetHeight', 'clientHeight'].map((prop) => {
    const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, prop)
    Object.defineProperty(HTMLElement.prototype, prop, {
      configurable: true,
      get(this: HTMLElement) {
        return this.hasAttribute('data-sui-scroll') ? VIEWPORT : ROW
      },
    })
    return () => {
      if (original) Object.defineProperty(HTMLElement.prototype, prop, original)
      else Reflect.deleteProperty(HTMLElement.prototype, prop)
    }
  })
  restore = [() => (Element.prototype.getBoundingClientRect = originalRect), ...descriptors]
})

afterAll(() => {
  for (const undo of restore) undo()
})

describe('virtualization', () => {
  it('renders a fraction of the rows, not all of them', async () => {
    render(
      <VirtualizedDataTable
        data={manyRows}
        columns={userColumns}
        label="Virtualized users"
        maxHeight={400}
      />,
    )

    await waitFor(() => expect(bodyRows().length).toBeGreaterThan(0))
    // The exact count depends on measurement; the point is that it is not 5,000.
    expect(bodyRows().length).toBeLessThan(200)
    // Spacer rows carry the remaining scroll height.
    expect(document.querySelectorAll('tbody tr[aria-hidden="true"]').length).toBeGreaterThan(0)
  })

  it('turns pagination off by default and keeps the full row count accessible', async () => {
    render(
      <VirtualizedDataTable
        data={manyRows}
        columns={userColumns}
        label="Virtualized users"
        maxHeight={400}
      />,
    )

    expect(screen.queryByRole('navigation', { name: 'Table pagination' })).not.toBeInTheDocument()
    // Every row of the table: the header row and 5,000 data rows.
    expect(screen.getByRole('table')).toHaveAttribute('aria-rowcount', '5001')
  })

  it('gives each rendered row its position in the whole table', async () => {
    render(
      <VirtualizedDataTable
        data={manyRows}
        columns={userColumns}
        label="Virtualized users"
        maxHeight={400}
      />,
    )
    await waitFor(() => expect(bodyRows().length).toBeGreaterThan(0))
    const scroller = document.querySelector<HTMLElement>('[data-sui-scroll]')!
    act(() => {
      scroller.scrollTop = ROW * 1_000
      scroller.dispatchEvent(new Event('scroll'))
    })
    await waitFor(() =>
      expect(Number((bodyRows()[0] as HTMLElement).dataset.index)).toBeGreaterThan(0),
    )
    for (const row of bodyRows()) {
      const index = Number((row as HTMLElement).dataset.index)
      expect(row).toHaveAttribute('aria-rowindex', String(index + 2))
    }
  })

  it('keeps the tab stop on a rendered row once the focused one scrolls away', async () => {
    render(
      <VirtualizedDataTable
        data={manyRows}
        columns={userColumns}
        label="Virtualized users"
        maxHeight={400}
        enableRowSelection
      />,
    )
    await waitFor(() => expect(bodyRows().length).toBeGreaterThan(0))
    const scroller = document.querySelector<HTMLElement>('[data-sui-scroll]')!
    act(() => {
      scroller.scrollTop = ROW * 1_000
      scroller.dispatchEvent(new Event('scroll'))
    })
    await waitFor(() =>
      expect(Number((bodyRows()[0] as HTMLElement).dataset.index)).toBeGreaterThan(0),
    )
    // Row 0 held the tab stop and is no longer in the DOM; one that is has it.
    const stops = Array.from(bodyRows()).filter((row) => row.getAttribute('tabindex') === '0')
    expect(stops).toHaveLength(1)
  })

  it('still renders the header, the toolbar and the empty state', async () => {
    const { rerender } = render(
      <VirtualizedDataTable
        data={manyRows}
        columns={userColumns}
        label="Virtualized users"
        maxHeight={400}
      />,
    )
    expect(screen.getAllByRole('columnheader')).toHaveLength(6)
    expect(screen.getByRole('searchbox', { name: 'Search table' })).toBeInTheDocument()

    rerender(
      <VirtualizedDataTable
        data={[]}
        columns={userColumns}
        label="Virtualized users"
        maxHeight={400}
      />,
    )
    await waitFor(() => expect(screen.getByText('No results')).toBeInTheDocument())
  })

  it('lets an explicit components.Body override win', () => {
    render(
      <VirtualizedDataTable
        data={manyRows.slice(0, 3)}
        columns={userColumns}
        label="Virtualized users"
        components={{
          Body: ({ bodyProps }) => (
            <tbody {...bodyProps}>
              <tr>
                <td data-testid="mine">Mine</td>
              </tr>
            </tbody>
          ),
        }}
      />,
    )
    expect(screen.getByTestId('mine')).toBeInTheDocument()
  })
})
