import {
  ChevronDownIcon,
  ColorModeToggle,
  Kbd,
  MenuIcon,
  SearchInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shining-technologies/ui'
import { THEME_PRESETS } from '@shining-technologies/ui/theme'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { GallerySection } from './sections'
import { CATEGORIES, SECTIONS, searchSections, slugify } from './sections'
import { SectionIdContext } from './sections/Demo'
import { useGalleryTheme } from './theme'

export interface GalleryShellProps {
  section: GallerySection
  onSelectSection: (id: string, anchor?: string) => void
}

/** How many package exports a category's pages show, for the heading's count. */
const countIn = (category: string) =>
  new Set(SECTIONS.filter((s) => s.category === category).flatMap((s) => s.components)).size

/**
 * The frame around every gallery page.
 *
 * The theme picker, the mode toggle and the search box are the package's own
 * components, and every colour in the frame is a theme token, so switching
 * theme restyles the whole page rather than a demo area inside it.
 */
export function GalleryShell({ section, onSelectSection }: GalleryShellProps) {
  const { theme, setThemeId } = useGalleryTheme()
  const [openGroups, setOpenGroups] = useState<ReadonlySet<string>>(
    () => new Set(section.group ? [section.group.id] : []),
  )
  const [query, setQuery] = useState('')
  // On a narrow screen the nav folds away behind a Browse button.
  const [navOpen, setNavOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const hits = useMemo(() => searchSections(query), [query])

  // Landing on a page inside a sub-menu (a link, the back button) opens that sub-menu.
  const currentGroup = section.group?.id
  useEffect(() => {
    if (currentGroup) setOpenGroups((open) => (open.has(currentGroup) ? open : new Set(open).add(currentGroup)))
  }, [currentGroup])

  // A new page (a link, the back button) folds the phone nav away again.
  useEffect(() => setNavOpen(false), [section.id])

  // "/" focuses the search, as on most documentation sites.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
      event.preventDefault()
      setNavOpen(true)
      searchRef.current?.focus()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const select = (id: string, anchor?: string) => {
    setNavOpen(false)
    onSelectSection(id, anchor)
  }

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
        onClick={() => select(item.id)}
      >
        <span>{item.label}</span>
        {item.category === 'Components' && item.components.length ? (
          <span className="gallery__count">
            <span aria-hidden="true">{item.components.length}</span>
            <span className="sui-sr-only">, {item.components.length} components</span>
          </span>
        ) : null}
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
          <button
            type="button"
            className="gallery__browse"
            aria-expanded={navOpen}
            aria-controls="gallery-nav"
            onClick={() => setNavOpen((open) => !open)}
          >
            <MenuIcon aria-hidden="true" />
            Browse
          </button>
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
        <nav id="gallery-nav" className="gallery__nav" aria-label="Components" data-open={navOpen || undefined}>
          <div className="gallery__search">
            <SearchInput
              ref={searchRef}
              value={query}
              onValueChange={setQuery}
              placeholder="Search components"
              aria-label="Search components"
              aria-describedby="gallery-search-hint"
              onKeyDown={(event) => {
                if (event.key === 'Enter' && hits[0]) {
                  const first = hits[0]
                  select(first.section.id, first.components[0] ? slugify(first.components[0]) : undefined)
                }
              }}
            />
            <p id="gallery-search-hint" className="gallery__search-hint">
              Press <Kbd>/</Kbd> to search, <Kbd>Enter</Kbd> to open the first result.
            </p>
          </div>

          {query.trim() ? (
            <div className="gallery__nav-group">
              <p className="gallery__nav-title" role="status">
                {hits.length} {hits.length === 1 ? 'page' : 'pages'} match
              </p>
              <ul className="gallery__results">
                {hits.map(({ section: hit, components }) => (
                  <li key={hit.id}>
                    <button
                      type="button"
                      className="gallery__nav-item"
                      aria-current={hit.id === section.id ? 'page' : undefined}
                      onClick={() => select(hit.id)}
                    >
                      <span>
                        {hit.label}
                        <span className="gallery__result-category">{hit.category}</span>
                      </span>
                    </button>
                    {components.length ? (
                      <ul className="gallery__result-components">
                        {components.map((name) => (
                          <li key={name}>
                            <button
                              type="button"
                              className="gallery__result-component"
                              onClick={() => select(hit.id, slugify(name))}
                            >
                              {name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
              {hits.length === 0 ? <p className="gallery__no-results">Nothing matches “{query}”.</p> : null}
            </div>
          ) : (
            CATEGORIES.map((category) => {
              const count = category === 'Components' ? countIn(category) : 0
              return (
                <div key={category} className="gallery__nav-group">
                  <p className="gallery__nav-title">
                    {category}
                    {count ? <span className="gallery__nav-total"> · {count}</span> : null}
                  </p>
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
              )
            })
          )}
        </nav>

        <main id="gallery-main" className="gallery__main" tabIndex={-1}>
          <div className="gallery__heading">
            <div>
              {section.category === 'Patterns' ? (
                <p className="gallery__eyebrow">Pattern</p>
              ) : section.group ? (
                <p className="gallery__eyebrow">{section.group.label}</p>
              ) : null}
              <h1>{section.label}</h1>
              <p>{section.blurb}</p>
              {section.components.length ? (
                <p className="gallery__exports">
                  {section.category === 'Patterns' ? 'Built from ' : 'On this page: '}
                  {section.components.map((name, index) => (
                    <span key={name}>
                      {index ? ', ' : null}
                      <code>{name}</code>
                    </span>
                  ))}
                </p>
              ) : null}
            </div>
            <span className="gallery__chip">{theme.name}</span>
          </div>

          <SectionIdContext.Provider value={section.id}>
            <section.render />
          </SectionIdContext.Provider>
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
