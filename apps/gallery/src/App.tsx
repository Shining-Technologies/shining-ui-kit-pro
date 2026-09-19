import { useEffect, useMemo, useState } from 'react'
import { GalleryShell } from './GalleryShell'
import { SECTIONS, findSection } from './sections'
import { GalleryThemeProvider } from './theme'

const sectionFromHash = () => (findSection(window.location.hash.slice(1)) ?? SECTIONS[0]!).id

/**
 * The gallery for `@shining-technologies/ui`.
 *
 * There is no provider to render: the package's theme is CSS variables, dark
 * mode is the `.dark` class and a preset is `data-theme` on `<html>`. The page
 * in view lives in the URL hash, so a link or a reload lands on the same page.
 */
export function App() {
  const [sectionId, setSectionId] = useState(sectionFromHash)

  useEffect(() => {
    const onHashChange = () => setSectionId(sectionFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const section = useMemo(
    () => SECTIONS.find((s) => s.id === sectionId) ?? SECTIONS[0]!,
    [sectionId],
  )

  return (
    <GalleryThemeProvider>
      <GalleryShell
        section={section}
        onSelectSection={(id) => {
          window.location.hash = id
          setSectionId(id)
          window.scrollTo({ top: 0 })
        }}
      />
    </GalleryThemeProvider>
  )
}
