import {
  ArrowLeftIcon,
  ArrowRightIcon,
  Button,
  ColorModeToggle,
  CommandMenu,
  FileIcon,
  LayoutIcon,
  MenuIcon,
  PaletteIcon,
  SearchIcon,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  type CommandItem,
} from '@shining-technologies/ui'
import { THEME_PRESETS } from '@shining-technologies/ui/theme'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { HOME, go } from './router'
import type { GallerySection } from './sections'
import { CATEGORIES, SECTIONS, slugify } from './sections'
import { SectionIdContext } from './sections/Demo'
import { useGalleryTheme } from './theme'

export const REPO_URL = 'https://github.com/Shining-Technologies/shining-ui-kit-pro'

export interface GalleryShellProps {
  /** The documentation page in view, or `null` on the home page. */
  section: GallerySection | null
  /** The home page, rendered full width when `section` is `null`. */
  children?: ReactNode
}

/** Top-level destinations in the header, each the first page of its part of the site. */
const TOP_LINKS = [
  { id: 'introduction', label: 'Docs', category: 'Getting started' },
  { id: 'actions', label: 'Components', category: 'Components' },
  { id: 'overview', label: 'Examples', category: 'Examples' },
  { id: 'themes', label: 'Themes', category: null },
] as const

/**
 * The frame around every page: a sticky header with search, theme and mode,
 * then either the home page or a documentation layout (sidebar, content,
 * "On this page").
 *
 * Every colour here is a theme token, so switching theme restyles the site
 * itself, not only the examples inside it.
 */
export function GalleryShell({ section, children }: GalleryShellProps) {
  const [navOpen, setNavOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  // A new page folds the phone nav away.
  const sectionId = section?.id ?? HOME
  useEffect(() => setNavOpen(false), [sectionId])

  // "/" opens search too, as on most documentation sites.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
      event.preventDefault()
      setSearchOpen(true)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="site">
      {/* Not a `#hash` link: the hash is the page router here. */}
      <a
        className="site__skip"
        href="#site-main"
        onClick={(event) => {
          event.preventDefault()
          document.getElementById('site-main')?.focus()
        }}
      >
        Skip to content
      </a>

      <SiteHeader
        section={section}
        onOpenNav={() => setNavOpen(true)}
        onOpenSearch={() => setSearchOpen(true)}
      />

      <SiteSearch open={searchOpen} onOpenChange={setSearchOpen} />

      {section ? (
        <div className="docs">
          <aside className="docs__sidebar" aria-label="Documentation">
            <DocsNav current={section.id} />
          </aside>

          <Sheet open={navOpen} onOpenChange={setNavOpen}>
            <SheetContent side="left" className="docs__sheet">
              <SheetHeader>
                <SheetTitle>Shining UI</SheetTitle>
              </SheetHeader>
              <DocsNav current={section.id} />
            </SheetContent>
          </Sheet>

          <main id="site-main" className="docs__main" tabIndex={-1}>
            <DocsPage section={section} />
          </main>
        </div>
      ) : (
        <main id="site-main" tabIndex={-1} className="site__home">
          {children}
        </main>
      )}

      <footer className="site__footer">
        <p>
          Built with <code>@shining-technologies/ui</code> by Shining Technologies. The source is on{' '}
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            GitHub
          </a>
          .
        </p>
      </footer>
    </div>
  )
}

/* ------------------------------------------------------------------ header */

function SiteHeader({
  section,
  onOpenNav,
  onOpenSearch,
}: {
  section: GallerySection | null
  onOpenNav: () => void
  onOpenSearch: () => void
}) {
  const { theme, setThemeId } = useGalleryTheme()
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

  return (
    <header className="site__header">
      <div className="site__header-inner">
        {section ? (
          <Button
            variant="ghost"
            size="icon"
            className="site__menu"
            aria-label="Open navigation"
            onClick={onOpenNav}
          >
            <MenuIcon />
          </Button>
        ) : null}

        <a
          className="site__brand"
          href="#"
          onClick={(event) => {
            event.preventDefault()
            go(HOME)
          }}
        >
          <span className="site__logo" aria-hidden="true" />
          <span>Shining UI</span>
        </a>

        <nav className="site__links" aria-label="Main">
          {TOP_LINKS.map((link) => {
            const active =
              section &&
              (link.category
                ? section.category === link.category && section.id !== 'themes'
                : section.id === link.id)
            return (
              <a
                key={link.id}
                href={`#${link.id}`}
                aria-current={active ? 'page' : undefined}
                onClick={(event) => {
                  event.preventDefault()
                  go(link.id)
                }}
              >
                {link.label}
              </a>
            )
          })}
        </nav>

        <div className="site__actions">
          <button type="button" className="site__search" onClick={onOpenSearch}>
            <SearchIcon aria-hidden="true" />
            <span className="site__search-text">Search documentation…</span>
            <kbd>{isMac ? '⌘' : 'Ctrl '}K</kbd>
          </button>

          <Select value={theme.id} onValueChange={setThemeId}>
            <SelectTrigger className="site__theme" aria-label="Theme">
              <span className="site__theme-dot" aria-hidden="true" />
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

          <a
            className="site__icon-link"
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub repository"
          >
            <GitHubIcon />
          </a>
          <ColorModeToggle defaultMode="light" />
        </div>
      </div>
    </header>
  )
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  )
}

/* ------------------------------------------------------------------ search */

function SiteSearch({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const items = useMemo<CommandItem[]>(() => {
    const pages: CommandItem[] = SECTIONS.map((s) => ({
      id: `page:${s.id}`,
      label: s.label,
      group: s.category,
      icon:
        s.category === 'Examples' ? (
          <LayoutIcon />
        ) : s.id === 'themes' ? (
          <PaletteIcon />
        ) : (
          <FileIcon />
        ),
      keywords: [...(s.keywords ?? []), s.blurb],
      onSelect: () => go(s.id),
    }))
    const seen = new Set<string>()
    const components: CommandItem[] = SECTIONS.filter((s) => s.category === 'Components').flatMap(
      (s) =>
        s.components
          .filter((name) => !seen.has(name) && seen.add(name))
          .map((name) => ({
            id: `component:${name}`,
            label: name,
            group: 'Components by name',
            description: s.label,
            onSelect: () => go(s.id, slugify(name)),
          })),
    )
    return [...pages, ...components]
  }, [])

  return (
    <CommandMenu
      items={items}
      open={open}
      onOpenChange={onOpenChange}
      title="Search documentation"
      placeholder="Search pages and components…"
    />
  )
}

/* -------------------------------------------------------------------- docs */

function DocsNav({ current }: { current: string }) {
  return (
    <nav className="docs__nav" aria-label="Pages">
      {CATEGORIES.map((category) => (
        <div key={category} className="docs__nav-group">
          <p className="docs__nav-title">{category}</p>
          <ul>
            {SECTIONS.filter((s) => s.category === category).map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  aria-current={s.id === current ? 'page' : undefined}
                  onClick={(event) => {
                    event.preventDefault()
                    go(s.id)
                  }}
                >
                  {s.label}
                  {s.id === 'email-builder' ? <span className="docs__new">New</span> : null}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function DocsPage({ section }: { section: GallerySection }) {
  const index = SECTIONS.findIndex((s) => s.id === section.id)
  const prev = SECTIONS[index - 1]
  const next = SECTIONS[index + 1]
  const toc = useToc(section.id)

  return (
    <div className="docs__page">
      <article className="docs__article">
        <header className="docs__header">
          <div className="docs__crumbs">
            <span>{section.category}</span>
            {section.group ? (
              <>
                <span aria-hidden="true">/</span>
                <span>{section.group.label}</span>
              </>
            ) : null}
          </div>
          <div className="docs__title-row">
            <h1>{section.label}</h1>
            <div className="docs__pager-icons">
              {prev ? (
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label={`Previous: ${prev.label}`}
                  onClick={() => go(prev.id)}
                >
                  <ArrowLeftIcon />
                </Button>
              ) : null}
              {next ? (
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label={`Next: ${next.label}`}
                  onClick={() => go(next.id)}
                >
                  <ArrowRightIcon />
                </Button>
              ) : null}
            </div>
          </div>
          <p className="docs__blurb">{section.blurb}</p>
          {section.components.length ? (
            <ul
              className="docs__exports"
              aria-label={section.category === 'Examples' ? 'Built from' : 'Components'}
            >
              {section.components.map((name) => (
                <li key={name}>
                  <code>{name}</code>
                </li>
              ))}
            </ul>
          ) : null}
        </header>

        <div className="docs__content">
          <SectionIdContext.Provider value={section.id}>
            <section.render />
          </SectionIdContext.Provider>
        </div>

        <nav className="docs__pager" aria-label="Pages">
          {prev ? (
            <a
              href={`#${prev.id}`}
              className="docs__pager-link"
              onClick={(event) => {
                event.preventDefault()
                go(prev.id)
              }}
            >
              <span>Previous</span>
              <strong>
                <ArrowLeftIcon aria-hidden="true" /> {prev.label}
              </strong>
            </a>
          ) : (
            <span />
          )}
          {next ? (
            <a
              href={`#${next.id}`}
              className="docs__pager-link docs__pager-link--next"
              onClick={(event) => {
                event.preventDefault()
                go(next.id)
              }}
            >
              <span>Next</span>
              <strong>
                {next.label} <ArrowRightIcon aria-hidden="true" />
              </strong>
            </a>
          ) : null}
        </nav>
      </article>

      {toc.length > 1 ? (
        <aside className="docs__toc" aria-label="On this page">
          <p className="docs__toc-title">On this page</p>
          <ul>
            {toc.map((entry) => (
              <li key={entry.id}>
                <a
                  href={`#${section.id}/${entry.slug}`}
                  onClick={(event) => {
                    event.preventDefault()
                    if (entry.demo) go(section.id, entry.slug)
                    else document.getElementById(entry.id)?.scrollIntoView({ block: 'start' })
                  }}
                >
                  {entry.title}
                </a>
              </li>
            ))}
          </ul>
        </aside>
      ) : null}
    </div>
  )
}

interface TocEntry {
  id: string
  slug: string
  title: string
  /** A demo is linked through the router; a prose heading is only scrolled to. */
  demo: boolean
}

/** The demos (or, on a prose page, the `h2`s) of the page in view, read from the DOM once it renders. */
function useToc(sectionId: string): TocEntry[] {
  const [entries, setEntries] = useState<TocEntry[]>([])
  useEffect(() => {
    const read = () => {
      const main = document.querySelector('.docs__content')
      if (!main) return
      const demos = [...main.querySelectorAll<HTMLElement>('.demo[data-demo-title]')].map((el) => ({
        id: el.id,
        slug: el.id.replace(/^demo-/, ''),
        title: el.dataset.demoTitle ?? '',
        demo: true,
      }))
      const headings = [...main.querySelectorAll<HTMLElement>('.prose h2[id]')].map((el) => ({
        id: el.id,
        slug: el.id,
        title: el.textContent ?? '',
        demo: false,
      }))
      setEntries(demos.length ? demos : headings)
    }
    read()
    // Some pages render their demos a tick later (charts measure first).
    const frame = requestAnimationFrame(read)
    return () => cancelAnimationFrame(frame)
  }, [sectionId])
  return entries
}
