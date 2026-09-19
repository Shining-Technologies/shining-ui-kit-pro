import {
  ChevronDownIcon,
  ColorModeToggle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shining-technologies/ui'
import { THEME_PRESETS } from '@shining-technologies/ui/theme'
import { useEffect, useState } from 'react'
import type { GallerySection } from './sections'
import { CATEGORIES, SECTIONS } from './sections'
import { useGalleryTheme } from './theme'

export interface GalleryShellProps {
  section: GallerySection
  onSelectSection: (id: string) => void
}

/**
 * The frame around every gallery page.
 *
 * The theme picker and the mode toggle are the package's own components, and
 * every colour in the frame is a theme token, so switching theme restyles the
 * whole page rather than a demo area inside it.
 */
export function GalleryShell({ section, onSelectSection }: GalleryShellProps) {
  const { theme, setThemeId } = useGalleryTheme()
  const [openGroups, setOpenGroups] = useState<ReadonlySet<string>>(
    () => new Set(section.group ? [section.group.id] : []),
  )

  // Landing on a page inside a sub-menu (a link, the back button) opens that sub-menu.
  const currentGroup = section.group?.id
  useEffect(() => {
    if (currentGroup) setOpenGroups((open) => (open.has(currentGroup) ? open : new Set(open).add(currentGroup)))
  }, [currentGroup])

  const toggleGroup = (id: string) =>
    setOpenGroups((open) => {
      const next = new Set(open)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const navItem = (item: GallerySection) => (
    <li key={item.id}>
      <button
        type="button"
        className="gallery__nav-item"
        aria-current={item.id === section.id ? 'page' : undefined}
        onClick={() => onSelectSection(item.id)}
      >
        {item.label}
      </button>
    </li>
  )

  return (
    <div className="gallery">
      {/* Not a `#hash` link: the hash is the page router here. */}
      <a
        className="gallery__skip"
        href="#gallery-main"
        onClick={(event) => {
          event.preventDefault()
          document.getElementById('gallery-main')?.focus()
        }}
      >
        Skip to content
      </a>

      <header className="gallery__bar">
        <div className="gallery__brand">
          <span className="gallery__mark" aria-hidden="true" />
          <div>
            <p className="gallery__title">Shining UI</p>
            <p className="gallery__subtitle">@shining-technologies/ui — every component, one theme</p>
          </div>
        </div>

        <div className="gallery__bar-actions">
          <Select value={theme.id} onValueChange={setThemeId}>
            <SelectTrigger className="gallery__theme" aria-label="Theme">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {THEME_PRESETS.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  {preset.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ColorModeToggle defaultMode="light" />
        </div>
      </header>

      <div className="gallery__body">
        <nav className="gallery__nav" aria-label="Components">
          {CATEGORIES.map((category) => (
            <div key={category} className="gallery__nav-group">
              <p className="gallery__nav-title">{category}</p>
              <ul>
                {navTree(SECTIONS.filter((s) => s.category === category)).map((node) => {
                  if (!('group' in node)) return navItem(node.section)
                  const { group, sections } = node
                  const open = openGroups.has(group.id)
                  const listId = `gallery-subnav-${group.id}`
                  return (
                    <li key={group.id}>
                      <button
                        type="button"
                        className="gallery__nav-item gallery__nav-toggle"
                        aria-expanded={open}
                        aria-controls={listId}
                        data-current={sections.some((s) => s.id === section.id) || undefined}
                        onClick={() => toggleGroup(group.id)}
                      >
                        {group.label}
                        <ChevronDownIcon className="gallery__nav-chevron" aria-hidden="true" />
                      </button>
                      <ul id={listId} className="gallery__subnav" hidden={!open}>
                        {sections.map(navItem)}
                      </ul>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        <main id="gallery-main" className="gallery__main" tabIndex={-1}>
          <div className="gallery__heading">
            <div>
              {section.group ? <p className="gallery__eyebrow">{section.group.label}</p> : null}
              <h1>{section.label}</h1>
              <p>{section.blurb}</p>
            </div>
            <span className="gallery__chip">{theme.name}</span>
          </div>

          <section.render />
        </main>
      </div>
    </div>
  )
}

type NavNode =
  | { section: GallerySection }
  | { group: NonNullable<GallerySection['group']>; sections: GallerySection[] }

/** Sections in order, with each group's sections gathered where the group first appears. */
function navTree(sections: GallerySection[]): NavNode[] {
  const nodes: NavNode[] = []
  const groups = new Map<string, GallerySection[]>()
  for (const item of sections) {
    if (!item.group) {
      nodes.push({ section: item })
      continue
    }
    const members = groups.get(item.group.id)
    if (members) members.push(item)
    else {
      const created = [item]
      groups.set(item.group.id, created)
      nodes.push({ group: item.group, sections: created })
    }
  }
  return nodes
}
