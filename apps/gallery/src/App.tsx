import { useEffect, useMemo, useState } from 'react'
import { GalleryShell } from './GalleryShell'
import { SECTIONS, findSection } from './sections'
import { GalleryThemeProvider } from './theme'

interface Route {
  sectionId: string
  /** A demo on the page, from `#<page>/<demo>`. */
  anchor?: string
}

function routeFromHash(): Route {
  const [id = '', anchor] = window.location.hash.slice(1).split('/')
  return { sectionId: (findSection(id) ?? SECTIONS[0]!).id, anchor: anchor || undefined }
}

/**
 * The gallery for `@shining-technologies/ui`.
 *
 * There is no provider to render: the package's theme is CSS variables, dark
 * mode is the `.dark` class and a preset is `data-theme` on `<html>`. The page
 * in view lives in the URL hash — `#<page>`, or `#<page>/<demo>` for one
 * example on it — so a link or a reload lands on the same place.
 */
export function App() {
  const [route, setRoute] = useState(routeFromHash)

  useEffect(() => {
    const onHashChange = () => setRoute(routeFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // Bring a linked demo into view once its page has rendered.
  useEffect(() => {
    if (!route.anchor) return
    const target = document.getElementById(`demo-${route.anchor}`)
    if (!target) return
    target.scrollIntoView({ block: 'start' })
    target.classList.add('demo--linked')
    const timer = window.setTimeout(() => target.classList.remove('demo--linked'), 1600)
    return () => window.clearTimeout(timer)
  }, [route])

  const section = useMemo(
    () => SECTIONS.find((s) => s.id === route.sectionId) ?? SECTIONS[0]!,
    [route.sectionId],
  )

  return (
    <GalleryThemeProvider>
      <GalleryShell
        section={section}
        onSelectSection={(id, anchor) => {
          const hash = anchor ? `${id}/${anchor}` : id
          if (window.location.hash.slice(1) !== hash) window.location.hash = hash
          setRoute({ sectionId: id, anchor })
          if (!anchor) window.scrollTo({ top: 0 })
        }}
      />
    </GalleryThemeProvider>
  )
}
