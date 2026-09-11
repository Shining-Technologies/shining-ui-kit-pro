/**
 * `@shining-technologies/ui-kit-examples`
 *
 * Real-world tables, written once and consumed by both Storybook and the docs
 * site. One copy means the examples cannot drift apart (see ARCHITECTURE.md §2).
 */
export * from './data'

export { BasicTable, basicColumns } from './basic'
export { UserManagementTable, userColumns } from './user-management'
export { EcommerceTable, productColumns } from './ecommerce'
export { OrdersTable, orderColumns } from './orders'
export { CrmTable, accountColumns } from './crm'
export { AnalyticsTable, metricColumns } from './analytics'
export { ServerSideTable, fetchPage } from './server-side'
export type { Page } from './server-side'
