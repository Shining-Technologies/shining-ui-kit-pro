import type { ComponentType } from 'react'
import { Actions } from './Actions'
import { Charts } from './Charts'
import { DataViews } from './DataViews'
import { FormInputs } from './FormInputs'
import { LayoutSection } from './Layout'
import { AppNavigation } from './navigation/AppNavigation'
import { LinksAndTabs } from './navigation/LinksAndTabs'
import { Menus } from './navigation/Menus'
import { StepsAndDisclosure } from './navigation/StepsAndDisclosure'
import './navigation/Navigation.css'
import { Overlays } from './Overlays'
import { Overview } from './Overview'
import { ApprovalWorkflowPattern } from './patterns/ApprovalWorkflow'
import { AuthPattern } from './patterns/Auth'
import { BillingPattern } from './patterns/Billing'
import { CrudPattern } from './patterns/Crud'
import { DetailPattern } from './patterns/Detail'
import { FormPagePattern } from './patterns/FormPage'
import { MultiStepPattern } from './patterns/MultiStep'
import { OnboardingPattern } from './patterns/Onboarding'
import './patterns/Patterns.css'
import { SearchFilterPattern } from './patterns/SearchFilter'
import { SettingsPattern } from './patterns/Settings'
import { ShellSection } from './Shell'
import { Surfaces } from './Surfaces'
import { Tables } from './Tables'
import { Themes } from './Themes'
import { Timelines } from './Timelines'

export interface GallerySection {
  id: string
  label: string
  category: string
  /**
   * A sub-menu in the gallery nav. Sections with the same group are listed
   * together under it, and `#<group id>` opens the first of them.
   */
  group?: { id: string; label: string }
  blurb: string
  /**
   * The package exports this page shows, by name. They are what the search
   * box matches, and their count is the number beside the page in the nav.
   */
  components: string[]
  /** Extra words the search should find this page by: "dashboard", "wizard". */
  keywords?: string[]
  render: ComponentType
}

const NAVIGATION = { id: 'navigation', label: 'Navigation' }
const DATA = { id: 'data', label: 'Data' }

export const SECTIONS: GallerySection[] = [
  {
    id: 'overview',
    label: 'Overview',
    category: 'Start here',
    blurb: 'A dashboard built from the package. Switch theme in the bar above and watch it repaint.',
    components: ['StatsCard', 'TrendChart', 'DonutChart', 'MetricTile', 'BreakdownList', 'AvatarGroup'],
    keywords: ['dashboard', 'kpi', 'analytics'],
    render: Overview,
  },
  {
    id: 'themes',
    label: 'Themes',
    category: 'Start here',
    blurb:
      'Every preset is a few seed colours turned into shadcn-named CSS variables. Compare them, then apply one.',
    components: [],
    keywords: ['theme', 'tokens', 'dark mode', 'preset', 'colour', 'color'],
    render: Themes,
  },
  {
    id: 'actions',
    label: 'Buttons & badges',
    category: 'Components',
    blurb:
      'Buttons, icon buttons, button groups, split buttons, toggles, badges, status badges, chips, menus and tooltips.',
    components: [
      'Button',
      'ButtonGroup',
      'CopyButton',
      'HoldButton',
      'Toggle',
      'ToggleGroup',
      'Badge',
      'StatusBadge',
      'Chip',
      'DropdownMenu',
      'Tooltip',
      'Kbd',
    ],
    keywords: ['icon button', 'split button', 'tag', 'action menu'],
    render: Actions,
  },
  {
    id: 'form-inputs',
    label: 'Form inputs',
    category: 'Components',
    blurb:
      'Every field a form is built from — text, search, number, password, phone, select, date, time, files, codes, tags, colour and rating — on one box and one focus style.',
    components: [
      'Field',
      'Label',
      'Fieldset',
      'Input',
      'InputGroup',
      'SearchInput',
      'Textarea',
      'NumberInput',
      'PasswordInput',
      'PasswordStrengthIndicator',
      'PhoneInput',
      'Select',
      'Combobox',
      'MultiCombobox',
      'DateField',
      'DateRangeField',
      'DateTimeField',
      'TimeField',
      'TimeInput',
      'Calendar',
      'Clock',
      'FileUpload',
      'ImageUpload',
      'OtpInput',
      'TagsInput',
      'ColorInput',
      'RatingInput',
      'Checkbox',
      'RadioGroup',
      'Switch',
      'Slider',
      'FloatingFormActions',
    ],
    keywords: ['autocomplete', 'multi-select', 'date picker', 'upload', 'range slider', 'form field'],
    render: FormInputs,
  },
  {
    id: 'surfaces',
    label: 'Cards & feedback',
    category: 'Components',
    blurb:
      'Cards, metric tiles, stats, breakdowns, status flows, alerts, banners, avatars, progress bars and rings, skeletons, empty and error states, and toasts.',
    components: [
      'Card',
      'StatsCard',
      'SummaryCard',
      'BreakdownList',
      'MetricTile',
      'MetricGrid',
      'StatusFlow',
      'StepCard',
      'StatusDot',
      'SegmentedBar',
      'Alert',
      'Banner',
      'Avatar',
      'AvatarGroup',
      'UserAvatar',
      'Progress',
      'CircularProgress',
      'Spinner',
      'Skeleton',
      'Empty',
      'Toaster',
    ],
    keywords: ['kpi', 'notification', 'callout', 'error state', 'loading state', 'offline', 'toast'],
    render: Surfaces,
  },
  {
    id: 'navigation-links',
    label: 'Tabs & links',
    category: 'Components',
    group: NAVIGATION,
    blurb:
      'Breadcrumbs, tabs, segmented controls, section tabs and pagination: moving between views and pages.',
    components: ['Breadcrumb', 'Tabs', 'SegmentedControl', 'SectionTabs', 'Pagination'],
    render: LinksAndTabs,
  },
  {
    id: 'navigation-menus',
    label: 'Menus & command',
    category: 'Components',
    group: NAVIGATION,
    blurb:
      'Dropdown, context and menubar menus on one item row, and a ⌘K command menu for keyboard users.',
    components: ['DropdownMenu', 'ContextMenu', 'Menubar', 'MenuShortcut', 'Command', 'CommandMenu'],
    keywords: ['command palette', 'right click'],
    render: Menus,
  },
  {
    id: 'navigation-steps',
    label: 'Steps & disclosure',
    category: 'Components',
    group: NAVIGATION,
    blurb: 'Steppers for tasks done in order, accordions and collapsibles.',
    components: ['Stepper', 'Accordion', 'Collapsible'],
    keywords: ['wizard'],
    render: StepsAndDisclosure,
  },
  {
    id: 'navigation-app',
    label: 'App navigation',
    category: 'Components',
    group: NAVIGATION,
    blurb:
      'Vertical navigation and the navigation rail, next to the sidebar and bottom navigation in the app shell.',
    components: ['VerticalNav', 'NavigationRail', 'Sidebar', 'AppShellBottomNav'],
    keywords: ['mobile bottom navigation'],
    render: AppNavigation,
  },
  {
    id: 'overlays',
    label: 'Overlays',
    category: 'Components',
    blurb:
      'Dialogs (including full screen), confirmations, sheets and drawers, popovers, hover cards, dropdown menus and tooltips.',
    components: [
      'Dialog',
      'AlertDialog',
      'ConfirmDialog',
      'Sheet',
      'Popover',
      'HoverCard',
      'DropdownMenu',
      'Tooltip',
    ],
    keywords: ['modal', 'drawer', 'confirmation'],
    render: Overlays,
  },
  {
    id: 'charts',
    label: 'Charts',
    category: 'Components',
    blurb: 'Trend, bar, donut, gauge, scatter and sparkline — Recharts on the theme palette.',
    components: ['TrendChart', 'BarChart', 'DonutChart', 'GaugeChart', 'ScatterChart', 'Sparkline', 'ChartFrame'],
    keywords: ['data visualization', 'graph'],
    render: Charts,
  },
  {
    id: 'tables',
    label: 'Data table',
    category: 'Components',
    group: DATA,
    blurb: 'The data table and the plain table, painted from the same tokens as everything else.',
    components: [
      'DataTable',
      'DataTableToolbar',
      'DataTablePagination',
      'RowActions',
      'Table',
      'createColumnHelper',
    ],
    keywords: ['grid', 'sort', 'filter', 'pagination', 'column visibility', 'bulk actions'],
    render: Tables,
  },
  {
    id: 'data-views',
    label: 'Boards & calendars',
    category: 'Components',
    group: DATA,
    blurb:
      'Filter bars, active-filter chips and bulk actions for views that are not tables, a kanban board and a month calendar of events.',
    components: ['FilterBar', 'FilterChips', 'BulkActionBar', 'KanbanBoard', 'EventCalendar'],
    keywords: ['kanban', 'pipeline', 'calendar', 'schedule', 'filter chip', 'toolbar'],
    render: DataViews,
  },
  {
    id: 'data-timelines',
    label: 'Timelines & trees',
    category: 'Components',
    group: DATA,
    blurb: 'A record’s history as a timeline, an activity feed or an audit log, and hierarchies in a tree.',
    components: ['Timeline', 'TimelineItem', 'TimelineHeading', 'TreeView'],
    keywords: ['activity feed', 'audit log', 'history', 'folders', 'hierarchy'],
    render: Timelines,
  },
  {
    id: 'layout',
    label: 'Layout',
    category: 'Components',
    blurb: 'Stack, grid and container on the spacing scale, and panels the user can resize.',
    components: ['Stack', 'Grid', 'Container', 'Separator', 'ResizablePanelGroup'],
    keywords: ['split pane', 'resizable', 'flex', 'inline'],
    render: LayoutSection,
  },
  {
    id: 'shell',
    label: 'App shell & sidebar',
    category: 'Patterns',
    blurb: 'The frame an application lives in: sidebar, header, page header and bottom navigation.',
    components: ['AppShell', 'AppShellHeader', 'Sidebar', 'SidebarNav', 'PageHeader', 'SkipToContent'],
    keywords: ['layout', 'user menu'],
    render: ShellSection,
  },
  {
    id: 'pattern-crud',
    label: 'List & CRUD page',
    category: 'Patterns',
    blurb:
      'A page of records: header and primary action, search, filters, bulk actions, the table, pagination, an empty state and a guarded delete.',
    components: ['PageHeader', 'DataTable', 'BulkActionBar', 'ConfirmDialog', 'Empty', 'Sheet'],
    keywords: ['list page', 'index', 'crud'],
    render: CrudPattern,
  },
  {
    id: 'pattern-detail',
    label: 'Detail page',
    category: 'Patterns',
    blurb: 'One record: breadcrumb, header with status and actions, summary, tabs, activity and related data.',
    components: ['Breadcrumb', 'PageHeader', 'StatusBadge', 'SummaryCard', 'Tabs', 'Timeline', 'Table'],
    keywords: ['record', 'show page'],
    render: DetailPattern,
  },
  {
    id: 'pattern-form',
    label: 'Create & edit form',
    category: 'Patterns',
    blurb: 'Sections of fields, validation on submit, and a save bar that knows whether there is anything to save.',
    components: ['Field', 'Fieldset', 'Card', 'FloatingFormActions', 'Alert'],
    keywords: ['form page', 'validation', 'save state'],
    render: FormPagePattern,
  },
  {
    id: 'pattern-wizard',
    label: 'Multi-step form',
    category: 'Patterns',
    blurb: 'A stepper over step content, each step validated before the next, a review, then submit.',
    components: ['Stepper', 'Field', 'Card', 'Empty'],
    keywords: ['wizard', 'stepper'],
    render: MultiStepPattern,
  },
  {
    id: 'pattern-approval',
    label: 'Approval workflow',
    category: 'Patterns',
    blurb: 'Draft, submitted, under review, then approved or rejected — with the history and the decision.',
    components: ['StatusFlow', 'Timeline', 'ConfirmDialog', 'Textarea', 'StatusBadge'],
    keywords: ['approve', 'reject', 'review', 'workflow'],
    render: ApprovalWorkflowPattern,
  },
  {
    id: 'pattern-search',
    label: 'Search & filter',
    category: 'Patterns',
    blurb: 'Search, filters and quick toggles, active-filter chips, results, pagination and a no-results state.',
    components: ['FilterBar', 'SearchInput', 'Chip', 'FilterChips', 'Grid', 'Pagination', 'Empty'],
    keywords: ['results', 'faceted search'],
    render: SearchFilterPattern,
  },
  {
    id: 'pattern-settings',
    label: 'Settings page',
    category: 'Patterns',
    blurb: 'Settings navigation beside sections of forms, save and reset per section, and a danger zone.',
    components: ['VerticalNav', 'Card', 'Field', 'Switch', 'Select', 'ConfirmDialog'],
    keywords: ['preferences', 'account settings', 'role selector', 'team'],
    render: SettingsPattern,
  },
  {
    id: 'pattern-billing',
    label: 'Billing & API keys',
    category: 'Patterns',
    blurb: 'Plan and pricing cards, usage meters, invoice history, API keys and webhook deliveries.',
    components: ['Card', 'Progress', 'CircularProgress', 'Table', 'CopyButton', 'Timeline', 'Banner'],
    keywords: ['pricing', 'subscription', 'usage meter', 'invoice', 'api key', 'webhook', 'upgrade'],
    render: BillingPattern,
  },
  {
    id: 'pattern-onboarding',
    label: 'Onboarding',
    category: 'Patterns',
    blurb: 'Welcome, profile, organisation, preferences, done: a first run that says how far along you are.',
    components: ['Stepper', 'Field', 'ImageUpload', 'SegmentedControl', 'Empty'],
    keywords: ['welcome', 'first run', 'setup'],
    render: OnboardingPattern,
  },
  {
    id: 'pattern-auth',
    label: 'Sign-in screens',
    category: 'Patterns',
    blurb: 'Sign in, create an account, reset a password and verify a code. The screens only — no auth logic.',
    components: ['Card', 'Field', 'Input', 'PasswordInput', 'PasswordStrengthIndicator', 'OtpInput', 'Checkbox'],
    keywords: ['login', 'register', 'forgot password', 'otp', 'verification', 'authentication'],
    render: AuthPattern,
  },
]

/** Sidebar groups, in the order the sections declare them. */
export const CATEGORIES = [...new Set(SECTIONS.map((section) => section.category))]

/** The section a hash names: a section id, or a group id for the group's first section. */
export function findSection(id: string): GallerySection | undefined {
  return (
    SECTIONS.find((section) => section.id === id) ??
    SECTIONS.find((section) => section.group?.id === id)
  )
}

export interface SearchHit {
  section: GallerySection
  /** Components on the page whose names matched, in the page's order. */
  components: string[]
}

/** Pages matching a query, by label, blurb, keyword or component name. */
export function searchSections(query: string): SearchHit[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const words = q.split(/\s+/)
  const has = (text: string) => words.every((word) => text.toLowerCase().includes(word))
  return SECTIONS.flatMap((section) => {
    const components = section.components.filter((name) => has(name))
    const matched =
      components.length > 0 ||
      has(section.label) ||
      has(section.blurb) ||
      (section.keywords ?? []).some(has)
    return matched ? [{ section, components }] : []
  })
}

export { Demo, DemoGrid, slugify } from './Demo'
