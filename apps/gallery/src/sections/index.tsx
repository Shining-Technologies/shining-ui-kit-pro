import type { ComponentType } from 'react'
import { Actions } from './Actions'
import { Charts } from './Charts'
import { FormInputs } from './FormInputs'
import { Navigation } from './Navigation'
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
  blurb: string
  render: ComponentType
}

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
    id: 'navigation',
    label: 'Navigation',
    category: 'Components',
    blurb: 'Tabs, accordions, breadcrumbs, section tabs and pagination.',
    render: Navigation,
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

export { Demo, DemoGrid } from './Demo'
