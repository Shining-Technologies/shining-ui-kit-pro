import { useEffect, useState } from 'react'
import { GalleryShell } from './GalleryShell'
import { Home } from './home/Home'
import { HOME, readRoute } from './router'
import { SECTIONS, findSection } from './sections'
import { GalleryThemeProvider } from './theme'

/**
 * The site for `@shining-technologies/ui`: a home page, then documentation
 * pages that each show a group of components live.
 *
 * There is no provider to render: the package's theme is CSS variables, dark
 * mode is the `.dark` class and a preset is `data-theme` on `<html>`. The page
 * in view lives in the URL hash (see `router.ts`), so a link or a reload lands
 * on the same place.
 */
export function App() {
  const [route, setRoute] = useState(readRoute)

  useEffect(() => {
    const onHashChange = () => setRoute(readRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // A new page starts at the top; a linked demo is brought into view and flashed.
  useEffect(() => {
    if (!route.anchor) {
      window.scrollTo({ top: 0 })
      return
    }
    const target = document.getElementById(`demo-${route.anchor}`)
    if (!target) return
    target.scrollIntoView({ block: 'start' })
    target.classList.add('demo--linked')
    const timer = window.setTimeout(() => target.classList.remove('demo--linked'), 1600)
    return () => window.clearTimeout(timer)
  }, [route])

  const section = route.sectionId === HOME ? null : (findSection(route.sectionId) ?? SECTIONS[0]!)

  return (
    <GalleryThemeProvider>
      <GalleryShell section={section}>{section ? null : <Home />}</GalleryShell>
    </GalleryThemeProvider>
  )
}
