import { makeUsers, type User } from '@shining-ui-kit/examples'
import { DataTable, type ColumnDef } from '@shining-ui-kit/react'
import { VirtualizedDataTable } from '@shining-ui-kit/react/virtualized'
import type { Meta, StoryObj } from '@storybook/react'

const columns: ColumnDef<User>[] = [
  { accessorKey: 'name', header: 'Name', size: 200, filter: { type: 'text' } },
  { accessorKey: 'email', header: 'Email', size: 260 },
  { accessorKey: 'role', header: 'Role', size: 120 },
  { accessorKey: 'location', header: 'Location', size: 150 },
  { accessorKey: 'lastActive', header: 'Last active', size: 150 },
]

const tenThousand = makeUsers(10_000)
const fiftyThousand = makeUsers(50_000)

const meta = {
  title: 'Performance',
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const LargeDataset: Story = {
  render: () => (
    <>
      <p className="sb-note">
        10,000 rows, paginated. Only the current page is ever in the DOM, so this costs the same as
        a 25-row table. Sorting and filtering still run across all 10,000.
      </p>
      <DataTable<User>
        data={tenThousand}
        columns={columns}
        label="Ten thousand users"
        pageSize={25}
      />
    </>
  ),
}

export const Virtualized: Story = {
  render: () => (
    <>
      <p className="sb-note">
        50,000 rows, no pagination. <code>VirtualizedDataTable</code> comes from
        <code> @shining-ui-kit/react/virtualized</code>, a separate entry point, so
        <code> @tanstack/react-virtual</code> only ships to apps that import it.
      </p>
      <VirtualizedDataTable<User>
        data={fiftyThousand}
        columns={columns}
        label="Fifty thousand users"
        maxHeight="60vh"
        features={{ virtualization: { enabled: true, estimateRowHeight: 48 } }}
      />
    </>
  ),
}

export const WideTable: Story = {
  render: () => (
    <>
      <p className="sb-note">40 columns with a pinned first column. Scroll sideways.</p>
      <DataTable<User>
        data={makeUsers(500)}
        columns={
          [
            { accessorKey: 'name', header: 'Name', size: 180, defaultPinned: 'left' },
            ...Array.from({ length: 39 }, (_, index) => ({
              id: `extra-${index}`,
              accessorPath: 'email',
              header: `Column ${index + 1}`,
              size: 160,
            })),
          ] as ColumnDef<User>[]
        }
        label="Wide table"
        pageSize={20}
        features={{ pinning: { enabled: true } }}
      />
    </>
  ),
}
