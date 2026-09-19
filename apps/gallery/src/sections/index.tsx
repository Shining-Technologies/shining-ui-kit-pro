import type { ComponentType } from 'react'
import { Actions } from './Actions'
import { Charts } from './Charts'
import { FormInputs } from './FormInputs'
import { AppNavigation } from './navigation/AppNavigation'
import { LinksAndTabs } from './navigation/LinksAndTabs'
import { Menus } from './navigation/Menus'
import { StepsAndDisclosure } from './navigation/StepsAndDisclosure'
import './navigation/Navigation.css'
import { Overlays } from './Overlays'
import { Overview } from './Overview'
import { ShellSection } from './Shell'
import { Surfaces } from './Surfaces'
import { Tables } from './Tables'
import { Themes } from './Themes'

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
  render: ComponentType
}

const NAVIGATION = { id: 'navigation', label: 'Navigation' }

export const SECTIONS: GallerySection[] = [
  {
    id: 'overview',
    label: 'Overview',
    category: 'Start here',
    blurb: 'A dashboard built from the package. Switch theme in the bar above and watch it repaint.',
    render: Overview,
  },
  {
    id: 'themes',
    label: 'Themes',
    category: 'Start here',
    blurb:
      'Every preset is a few seed colours turned into shadcn-named CSS variables. Compare them, then apply one.',
    render: Themes,
  },
  {
    id: 'actions',
    label: 'Buttons & badges',
    category: 'Components',
    blurb: 'Buttons, button groups, toggles, badges, status badges, menus and tooltips.',
    render: Actions,
  },
  {
    id: 'form-inputs',
    label: 'Form inputs',
    category: 'Components',
    blurb:
      'Every field a form is built from — text, number, password, phone, select, date, time, files, codes, tags, colour and rating — on one box and one focus style.',
    render: FormInputs,
  },
  {
    id: 'surfaces',
    label: 'Cards & feedback',
    category: 'Components',
    blurb:
      'Cards, metric tiles, stats, breakdowns, status flows, alerts, avatars, progress, skeletons and toasts.',
    render: Surfaces,
  },
  {
    id: 'navigation-links',
    label: 'Tabs & links',
    category: 'Components',
    group: NAVIGATION,
    blurb:
      'Breadcrumbs, tabs, segmented controls, section tabs and pagination: moving between views and pages.',
    render: LinksAndTabs,
  },
  {
    id: 'navigation-menus',
    label: 'Menus & command',
    category: 'Components',
    group: NAVIGATION,
    blurb:
      'Dropdown, context and menubar menus on one item row, and a ⌘K command menu for keyboard users.',
    render: Menus,
  },
  {
    id: 'navigation-steps',
    label: 'Steps & disclosure',
    category: 'Components',
    group: NAVIGATION,
    blurb: 'Steppers for tasks done in order, accordions and collapsibles.',
    render: StepsAndDisclosure,
  },
  {
    id: 'navigation-app',
    label: 'App navigation',
    category: 'Components',
    group: NAVIGATION,
    blurb:
      'Vertical navigation and the navigation rail, next to the sidebar and bottom navigation in the app shell.',
    render: AppNavigation,
  },
  {
    id: 'overlays',
    label: 'Overlays',
    category: 'Components',
    blurb: 'Dialogs, confirmations, sheets, popovers, dropdown menus and tooltips.',
    render: Overlays,
  },
  {
    id: 'charts',
    label: 'Charts',
    category: 'Components',
    blurb: 'Trend, bar, donut, gauge, scatter and sparkline — Recharts on the theme palette.',
    render: Charts,
  },
  {
    id: 'tables',
    label: 'Data table',
    category: 'Components',
    blurb: 'The data table and the plain table, painted from the same tokens as everything else.',
    render: Tables,
  },
  {
    id: 'shell',
    label: 'App shell & sidebar',
    category: 'Patterns',
    blurb: 'The frame an application lives in: sidebar, header, page header and bottom navigation.',
    render: ShellSection,
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

export { Demo, DemoGrid } from './Demo'
