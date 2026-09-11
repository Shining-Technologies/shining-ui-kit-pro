import { OrdersTable, UserManagementTable } from '@shining-technologies/ui-kit-examples'
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

/**
 * The examples are documentation that runs.
 *
 * They are the first thing anyone copies, and they are consumed by both
 * Storybook and the gallery — so a change that breaks one of them breaks the
 * library's own argument. This asserts the shape the flagship table promises,
 * not its wording.
 */
describe('the orders example', () => {
  it('renders the full vocabulary of a back-office table', () => {
    render(<OrdersTable />)

    // Title and description: what the list is, and what is not in it.
    expect(screen.getByText('Orders')).toBeVisible()

    // A visible actions header over however many icons the row needs.
    expect(screen.getByRole('columnheader', { name: 'Actions' })).toBeVisible()

    const rows = document.querySelectorAll<HTMLElement>('tbody tr[data-sui-row]')
    expect(rows).toHaveLength(15)

    const first = rows[0]!
    expect(within(first).getByRole('link', { name: 'View order' })).toBeInTheDocument()
    expect(within(first).getByRole('button', { name: 'Edit order' })).toBeInTheDocument()

    // Seeded avatars, stacked identifiers, and the actions column frozen right.
    expect(document.querySelector('.sui-avatar[data-tone]')).toBeInTheDocument()
    expect(document.querySelector('.sui-cell-stack')).toBeInTheDocument()
    expect(document.querySelector('td[data-column-id="sui-actions"]')).toHaveClass('sui-pinned')
  })
})

describe('the user management example', () => {
  it('renders', () => {
    render(<UserManagementTable />)
    expect(document.querySelectorAll('tbody tr[data-sui-row]').length).toBeGreaterThan(0)
  })
})
