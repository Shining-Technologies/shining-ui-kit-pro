import {
  Badge,
  Button,
  ColorModeToggle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DropdownMenuItem,
  ProjectEditor,
  ProjectSwitcher,
  useUIKit,
} from '@shining-technologies/ui-kit-react'
import { useState } from 'react'
import { ProjectPanel } from './ProjectPanel'
import type { GallerySection } from './sections'
import { CATEGORIES, SECTIONS } from './sections'

export interface GalleryShellProps {
  section: GallerySection
  onSelectSection: (id: string) => void
}

/**
 * The frame around every gallery page.
 *
 * Every piece of it — the sidebar, the switcher, the badges — is built from the
 * kit itself, which makes the shell the first and most honest demonstration
 * that switching project restyles an application rather than a demo area.
 */
export function GalleryShell({ section, onSelectSection }: GalleryShellProps) {
  const { project } = useUIKit()
  const [creating, setCreating] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)

  return (
    <div className="gallery">
      <a className="gallery__skip" href="#gallery-main">
        Skip to content
      </a>

      <header className="gallery__bar">
        <div className="gallery__brand">
          <span className="gallery__mark" aria-hidden="true" />
          <div>
            <p className="gallery__title">Shining UI Kit</p>
            <p className="gallery__subtitle">One project, every component</p>
          </div>
        </div>

        <div className="gallery__bar-actions">
          <ProjectSwitcher
            footer={
              <DropdownMenuItem onSelect={() => setCreating(true)}>+ New project…</DropdownMenuItem>
            }
          />
          <ColorModeToggle />
          <Button variant="outline" size="sm" onClick={() => setPanelOpen(true)}>
            Customise
          </Button>
        </div>
      </header>

      <div className="gallery__body">
        <nav className="gallery__nav" aria-label="Components">
          {CATEGORIES.map((category) => (
            <div key={category} className="gallery__nav-group">
              <p className="gallery__nav-title">{category}</p>
              <ul>
                {SECTIONS.filter((s) => s.category === category).map((item) => (
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
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <main id="gallery-main" className="gallery__main" tabIndex={-1}>
          <div className="gallery__heading">
            <div>
              <h1>{section.label}</h1>
              <p>{section.blurb}</p>
            </div>
            <Badge tone="primary" variant="soft">
              {project.name}
            </Badge>
          </div>

          <section.render />
        </main>
      </div>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>New project</DialogTitle>
            <DialogDescription>
              Pick a starting palette, then change any colour. Everything else — hovers, borders,
              dark mode, chart series and readable label colours — is generated for you.
            </DialogDescription>
          </DialogHeader>
          <ProjectEditor onSubmit={() => setCreating(false)} onCancel={() => setCreating(false)} />
        </DialogContent>
      </Dialog>

      <ProjectPanel open={panelOpen} onOpenChange={setPanelOpen} />
    </div>
  )
}
