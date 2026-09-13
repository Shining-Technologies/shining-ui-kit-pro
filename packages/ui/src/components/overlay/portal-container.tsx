'use client'

import { createContext, useContext, type ReactNode } from 'react'

/**
 * Where dialogs, menus, popovers and tooltips render.
 *
 * By default they portal to `<body>`, which inherits the theme from `:root` /
 * `.dark`. A subtree themed on its own — `<section data-theme="ember">` — is
 * not an ancestor of `<body>`, so its portals would lose that theme. Wrap such
 * a subtree and point portals at an element inside it:
 *
 * ```tsx
 * const [container, setContainer] = useState<HTMLElement | null>(null)
 * <section data-theme="ember" ref={setContainer}>
 *   <PortalContainerProvider container={container}>…</PortalContainerProvider>
 * </section>
 * ```
 *
 * No provider is needed for an application-wide theme.
 */
const PortalContainerContext = createContext<HTMLElement | null | undefined>(undefined)

export interface PortalContainerProviderProps {
  container: HTMLElement | null | undefined
  children?: ReactNode
}

export function PortalContainerProvider({ container, children }: PortalContainerProviderProps) {
  return (
    <PortalContainerContext.Provider value={container}>{children}</PortalContainerContext.Provider>
  )
}

/** The element portalled surfaces render into; `undefined` means `<body>`. */
export function usePortalContainer(): HTMLElement | undefined {
  return useContext(PortalContainerContext) ?? undefined
}
