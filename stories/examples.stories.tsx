import {
  AnalyticsTable,
  CrmTable,
  EcommerceTable,
  OrdersTable,
  ServerSideTable,
  UserManagementTable,
} from '@shining-technologies/ui-kit-examples'
import type { Meta, StoryObj } from '@storybook/react'

/**
 * The real-world tables from `examples/`, rendered exactly as the docs site
 * renders them — one source, two consumers.
 */
const meta = {
  title: 'Examples',
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const UserManagement: Story = { render: () => <UserManagementTable /> }
export const Ecommerce: Story = { render: () => <EcommerceTable /> }
export const Orders: Story = { render: () => <OrdersTable /> }
export const Crm: Story = { name: 'CRM', render: () => <CrmTable /> }
export const Analytics: Story = { render: () => <AnalyticsTable /> }
export const ServerSide: Story = { render: () => <ServerSideTable /> }
