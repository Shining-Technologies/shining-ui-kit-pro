import type { ComponentType } from 'react'
import { Actions } from './Actions'
import { Charts } from './Charts'
import { FormInputs } from './FormInputs'
import { Navigation } from './Navigation'
import { Overlays } from './Overlays'
import { Overview } from './Overview'
import { Projects } from './Projects'
import { ShellSection } from './Shell'
import { Surfaces } from './Surfaces'
import { Tables } from './Tables'

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
    blurb: 'A dashboard built from the kit. Switch project in the bar above and watch it repaint.',
    render: Overview,
  },
  {
    id: 'projects',
    label: 'Projects',
    category: 'Start here',
    blurb:
      'Every project is a few seed colours. Compare them side by side, or build one of your own.',
    render: Projects,
  },
  {
    id: 'actions',
    label: 'Buttons & badges',
    category: 'Components',
    blurb: 'Buttons, button groups, toggles, badges, status badges, menus and tooltips.',
    render: Actions,
  },
  {
    id: 'surfaces',
    label: 'Cards & feedback',
    category: 'Components',
    blurb:
      'Cards, summary and step cards, metric tiles, breakdowns, status flows, alerts, avatars, progress, skeletons and empty states.',
    render: Surfaces,
  },
  {
    id: 'form-inputs',
    label: 'Form Inputs',
    category: 'Components',
    blurb:
      'Every field a form is built from: text, number, password, phone, select, multi-select, date, time, files, images, code, tags, colour and rating.',
    render: FormInputs,
  },
  {
    id: 'navigation',
    label: 'Navigation',
    category: 'Components',
    blurb: 'Tabs, accordions, breadcrumbs, collapsibles and page navigation.',
    render: Navigation,
  },
  {
    id: 'overlays',
    label: 'Overlays',
    category: 'Components',
    blurb: 'Dialogs, confirmations, sheets, popovers and hover cards.',
    render: Overlays,
  },
  {
    id: 'charts',
    label: 'Charts',
    category: 'Components',
    blurb: 'Line, area, bar, pie and sparkline — dependency-free SVG on the project palette.',
    render: Charts,
  },
  {
    id: 'tables',
    label: 'Data table',
    category: 'Components',
    blurb:
      'The full data table and the plain table, painted from exactly the same tokens as everything else.',
    render: Tables,
  },
  {
    id: 'shell',
    label: 'App shell',
    category: 'Patterns',
    blurb:
      'The frame an application lives in: sidebar, header, page header, section tabs, confirmations and toasts.',
    render: ShellSection,
  },
]

/** Sidebar groups, in the order the sections declare them. */
export const CATEGORIES = [...new Set(SECTIONS.map((section) => section.category))]

export { Demo, DemoGrid } from './Demo'
