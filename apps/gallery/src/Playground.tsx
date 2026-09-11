import { users, type User } from '@shining-ui-kit/examples'
import {
  CellBadge,
  CellPerson,
  DataTable,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  type ColumnDef,
} from '@shining-ui-kit/react'
import { midnightTheme, type UIKitTheme } from '@shining-ui-kit/themes'
import { useState } from 'react'
import { PLAYGROUND_DEFAULTS, PlaygroundControls, type PlaygroundState } from './PlaygroundControls'

/**
 * Every appearance control in one place.
 *
 * The point of this screen is that none of these switches touch behaviour:
 * sorting, filtering, selection and pagination keep working identically no
 * matter what you pick.
 */
const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'name',
    header: 'User',
    size: 240,
    enableHiding: false,
    cell: ({ value, row }) => <CellPerson name={value} description={row.original.email} />,
    filter: { type: 'text' },
  },
  {
    accessorKey: 'role',
    header: 'Role',
    size: 120,
    filter: {
      type: 'multiSelect',
      options: ['Owner', 'Admin', 'Editor', 'Viewer'].map((value) => ({ label: value, value })),
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 130,
    cell: ({ value }) => (
      <CellBadge tone={value === 'active' ? 'success' : value === 'invited' ? 'info' : 'danger'}>
        {value}
      </CellBadge>
    ),
    filter: {
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Invited', value: 'invited' },
        { label: 'Suspended', value: 'suspended' },
      ],
    },
  },
  {
    accessorKey: 'location',
    header: 'Location',
    size: 150,
    meta: { responsive: { hideBelow: 'md' } },
    filter: { type: 'text' },
  },
  { accessorKey: 'lastActive', header: 'Last active', size: 150, filter: { type: 'date' } },
]

const THEMES: Record<string, UIKitTheme | undefined> = {
  none: undefined,
  midnight: midnightTheme,
  branded: {
    colors: {
      accent: '#db2777',
      ring: '#db2777',
      headerBackground: '#fdf2f8',
      headerForeground: '#9d174d',
      rowHover: '#fdf2f8',
      rowSelected: '#fce7f3',
    },
    radius: { table: '4px', control: '3px' },
    dark: {
      colors: {
        headerBackground: '#2a0d1c',
        headerForeground: '#f9a8d4',
        rowHover: '#22101a',
        rowSelected: '#3b1327',
      },
    },
  },
}

export function Playground() {
  const [state, setState] = useState<PlaygroundState>(PLAYGROUND_DEFAULTS)
  const set = (patch: Partial<PlaygroundState>) => setState((current) => ({ ...current, ...patch }))
  const { selection, expansion, actions, pinActions, framed } = state

  return (
    <div className="pg">
      <PlaygroundControls
        value={state}
        onChange={set}
        onReset={() => setState(PLAYGROUND_DEFAULTS)}
        themeNames={Object.keys(THEMES)}
      />

      <DataTable<User>
        data={users.slice(0, 24)}
        columns={columns}
        title="Team members"
        description="Everyone with access to this workspace. Suspended accounts stay listed — they still hold data."
        getRowId={(row) => row.id}
        variant={state.variant}
        density={state.density}
        responsiveMode={state.responsiveMode}
        tableLayout={state.tableLayout}
        filterLayout={state.filterLayout}
        theme={THEMES[state.themeName]}
        enableRowSelection={selection}
        features={{ pinning: { actions: pinActions ? 'right' : false } }}
        maxHeight={framed ? 460 : undefined}
        pageSize={10}
        rowActions={
          actions
            ? (row) => [
                { icon: EyeIcon, label: `View ${row.original.name}`, onClick: () => {} },
                { icon: PencilIcon, label: `Edit ${row.original.name}`, onClick: () => {} },
                {
                  icon: TrashIcon,
                  label: `Remove ${row.original.name}`,
                  destructive: true,
                  onClick: () => {},
                },
              ]
            : undefined
        }
        renderExpandedRow={
          expansion
            ? (row) => (
                <dl className="ex-details">
                  <div>
                    <dt>Phone</dt>
                    <dd>{row.original.phone}</dd>
                  </div>
                  <div>
                    <dt>Joined</dt>
                    <dd>{row.original.createdAt}</dd>
                  </div>
                </dl>
              )
            : undefined
        }
      />
    </div>
  )
}
