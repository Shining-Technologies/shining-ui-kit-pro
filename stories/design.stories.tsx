import { users, type User } from '@shining-ui-kit/examples'
import { DataTable, type ColumnDef, type Density, type TableVariant } from '@shining-ui-kit/react'
import { dashboardTheme, midnightTheme, minimalTheme } from '@shining-ui-kit/themes'
import type { Meta, StoryObj } from '@storybook/react'

const columns: ColumnDef<User>[] = [
  { accessorKey: 'name', header: 'Name', size: 200 },
  { accessorKey: 'email', header: 'Email', size: 240 },
  { accessorKey: 'role', header: 'Role', size: 120 },
  { accessorKey: 'location', header: 'Location', size: 140 },
  { accessorKey: 'lastActive', header: 'Last active', size: 150 },
]

const meta = {
  title: 'Design',
  component: DataTable<User>,
  args: { data: users.slice(0, 6), columns, label: 'Team members', showPagination: false },
} satisfies Meta<typeof DataTable<User>>

export default meta
type Story = StoryObj<typeof meta>

const VARIANTS: TableVariant[] = [
  'default',
  'minimal',
  'compact',
  'borderless',
  'striped',
  'dashboard',
]

export const Variants: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: '2.5rem' }}>
      {VARIANTS.map((variant) => (
        <section key={variant}>
          <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.8125rem', textTransform: 'uppercase' }}>
            {variant}
          </h3>
          <DataTable<User> {...args} variant={variant} />
        </section>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Every variant is the same component with different tokens and classes — there is no ' +
          'second table implementation anywhere in the library.',
      },
    },
  },
}

const DENSITIES: Density[] = ['compact', 'comfortable', 'spacious']

export const DensityScale: Story = {
  name: 'Density',
  render: (args) => (
    <div style={{ display: 'grid', gap: '2.5rem' }}>
      {DENSITIES.map((density) => (
        <section key={density}>
          <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.8125rem', textTransform: 'uppercase' }}>
            {density}
          </h3>
          <DataTable<User> {...args} density={density} />
        </section>
      ))}
    </div>
  ),
}

export const DarkMode: Story = {
  globals: { theme: 'dark' },
  parameters: {
    docs: {
      description: {
        story:
          'Dark mode comes from the app: a `.dark` class on an ancestor (use the toolbar toggle). ' +
          'The table never decides on its own.',
      },
    },
  },
}

export const Theming: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: '2.5rem' }}>
      <section>
        <h3 className="sb-note">Inline theme object</h3>
        <DataTable<User>
          {...args}
          theme={{
            colors: {
              headerBackground: '#111827',
              headerForeground: '#e5e7eb',
              rowHover: '#f8fafc',
              border: '#cbd5e1',
              accent: '#7c3aed',
            },
            radius: { table: '14px' },
            density: 'comfortable',
          }}
        />
      </section>
      <section>
        <h3 className="sb-note">minimalTheme</h3>
        <DataTable<User> {...args} theme={minimalTheme} />
      </section>
      <section>
        <h3 className="sb-note">dashboardTheme</h3>
        <DataTable<User> {...args} theme={dashboardTheme} />
      </section>
      <section>
        <h3 className="sb-note">midnightTheme (a full custom palette)</h3>
        <DataTable<User> {...args} theme={midnightTheme} />
      </section>
    </div>
  ),
}

export const CssVariableOverride: Story = {
  name: 'CSS variable override',
  render: (args) => (
    <>
      <style>{`
        .sb-branded {
          --sui-primary: #db2777;
          --sui-ring: #db2777;
          --sui-radius: 2px;
          --sui-header-background: #fdf2f8;
          --sui-header-foreground: #9d174d;
          --sui-row-hover: #fdf2f8;
        }
      `}</style>
      <p className="sb-note">
        No props at all — just CSS custom properties set on an ancestor. Useful when your design
        tokens already live in CSS.
      </p>
      <div className="sb-branded">
        <DataTable<User> {...args} />
      </div>
    </>
  ),
}

export const Responsive: Story = {
  render: (args) => (
    <>
      <p className="sb-note">
        Narrow the viewport. In <code>cards</code> mode each row becomes a card and each cell prints
        its column name — done entirely in CSS, with no second render path.
      </p>
      <DataTable<User>
        {...args}
        responsiveMode="cards"
        columns={[
          { accessorKey: 'name', header: 'Name' },
          { accessorKey: 'email', header: 'Email' },
          { accessorKey: 'role', header: 'Role' },
          {
            accessorKey: 'location',
            header: 'Location',
            meta: { responsive: { hideBelow: 'lg' } },
          },
        ]}
      />
    </>
  ),
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}

export const StickyHeader: Story = {
  args: {
    data: users.slice(0, 30),
    maxHeight: 320,
    showPagination: false,
  },
}
