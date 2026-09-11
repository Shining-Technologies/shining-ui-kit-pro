import { globalProjectRegistry, UIKitProvider } from '@shining-technologies/ui-kit-react'
import { useMemo, useState } from 'react'
import { GalleryShell } from './GalleryShell'
import { SECTIONS } from './sections'

/**
 * The gallery.
 *
 * One `<UIKitProvider>` wraps everything, in `global` scope so the tokens land
 * on `<html>` and reach portalled surfaces — dialogs, dropdowns, tooltips —
 * which would otherwise render outside a scoped wrapper and keep the defaults.
 *
 * The registry is the module-level singleton, so projects created here persist
 * across reloads in this browser.
 */
export function App() {
  const [sectionId, setSectionId] = useState(SECTIONS[0]!.id)
  const section = useMemo(
    () => SECTIONS.find((s) => s.id === sectionId) ?? SECTIONS[0]!,
    [sectionId],
  )

  return (
    <UIKitProvider registry={globalProjectRegistry} scope="global" defaultMode="light">
      <GalleryShell section={section} onSelectSection={setSectionId} />
    </UIKitProvider>
  )
}
