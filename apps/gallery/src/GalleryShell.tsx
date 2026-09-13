import {
  ColorModeToggle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shining-technologies/ui'
import { THEME_PRESETS } from '@shining-technologies/ui/theme'
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
            <span className="gallery__chip">{theme.name}</span>
          </div>

          <section.render />
        </main>
      </div>
    </div>
  )
}
