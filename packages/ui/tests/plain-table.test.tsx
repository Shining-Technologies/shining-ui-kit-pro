/**
 * The plain `Table`: density vocabulary and header padding, row selection
 * semantics — plus the exported icon props type.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  CheckIcon,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  tableVariants,
  type IconProps,
  type TableProps,
} from '@shining-technologies/ui'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'

describe('Table density', () => {
  it("accepts the kit's 'comfortable', with 'default' as an alias", () => {
    const comfortable: TableProps['density'] = 'comfortable'
    expect(tableVariants({ density: comfortable })).toBe(tableVariants({ density: 'default' }))
    expect(tableVariants({ density: 'comfortable' })).toBe(tableVariants({}))
    expect(tableVariants({ density: 'compact' })).toContain('sui-plain-table--compact')
    expect(tableVariants({ density: 'spacious' })).toContain('sui-plain-table--spacious')
  })

  it('pads header cells as well as body cells, keeping them aligned', () => {
    const css = readFileSync(resolve(__dirname, '../src/styles/composites.css'), 'utf8').replace(
      /\/\*[\s\S]*?\*\//g,
      '',
    )
    // Density sets the padding tokens both cell rules read, not the body cells alone.
    expect(css).not.toMatch(/\.sui-plain-table--(compact|spacious)\s+\.sui-plain-table__td\s*\{/)
    for (const density of ['compact', 'spacious']) {
      const body = new RegExp(`\\.sui-plain-table--${density}\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? ''
      const decl = (name: string) => new RegExp(`${name}:\\s*([^;]+);`).exec(body)?.[1]
      expect(decl('--sui-header-padding-y'), density).toMatch(/rem$/)
      expect(decl('--sui-cell-padding-y'), density).toMatch(/rem$/)
      expect(decl('--sui-header-padding-x'), density).toBe(decl('--sui-cell-padding-x'))
    }
    expect(css).toMatch(/\.sui-plain-table__th\s*\{[^}]*var\(--sui-header-padding-y\)/)
  })
})

describe('TableRow selection', () => {
  it('states selection with aria-selected', async () => {
    const { container } = render(
      <Table aria-label="Plans">
        <TableHeader>
          <TableRow>
            <TableHead>Plan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow selected>
            <TableCell>Business</TableCell>
          </TableRow>
          <TableRow selected={false}>
            <TableCell>Starter</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Legacy</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    )
    const rows = screen.getAllByRole('row').slice(1)
    expect(rows[0]).toHaveAttribute('aria-selected', 'true')
    expect(rows[0]).toHaveAttribute('data-state', 'selected')
    expect(rows[1]).toHaveAttribute('aria-selected', 'false')
    expect(rows[2]).not.toHaveAttribute('aria-selected')
    expect((await axe(container)).violations).toEqual([])
  })
})

describe('icons', () => {
  it('export their props type', () => {
    const props: IconProps = { width: 20, height: 20, className: 'glyph' }
    const { container } = render(<CheckIcon {...props} />)
    expect(container.querySelector('svg')).toHaveAttribute('width', '20')
  })
})
