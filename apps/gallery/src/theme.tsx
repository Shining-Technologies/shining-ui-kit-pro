import { THEME_PRESETS, createThemeCss, type ThemePreset } from '@shining-technologies/ui/theme'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

const STORAGE_KEY = 'sui-gallery-theme'
const DEFAULT_THEME = 'shining'

/**
 * Every shipped preset as one stylesheet, keyed on `data-theme` on `<html>`.
 *
 * This is the pattern the theming guide gives for a per-tenant theme —
 * `createThemeCss` output in a `<style>` — so switching theme here exercises
 * exactly what an application ships.
 */
export function presetStylesheet(): string {
  return THEME_PRESETS.map((preset) =>
    createThemeCss(
      { ...preset.seed, neutralTint: preset.neutralTint, radius: preset.radius },
      {
        selector: `:root[data-theme='${preset.id}']`,
        darkSelector: `:root.dark[data-theme='${preset.id}']`,
      },
    ),
  ).join('\n')
}

export function storedThemeId(): string {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored && THEME_PRESETS.some((preset) => preset.id === stored) ? stored : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

interface GalleryThemeValue {
  theme: ThemePreset
  setThemeId: (id: string) => void
}

const GalleryThemeContext = createContext<GalleryThemeValue | null>(null)

export function GalleryThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState(storedThemeId)

  useEffect(() => {
    document.documentElement.dataset.theme = themeId
    try {
      window.localStorage.setItem(STORAGE_KEY, themeId)
    } catch {
      // Storage blocked: the theme still applies for this page.
    }
  }, [themeId])

  const value = useMemo<GalleryThemeValue>(
    () => ({
      theme: THEME_PRESETS.find((preset) => preset.id === themeId) ?? THEME_PRESETS[0],
      setThemeId,
    }),
    [themeId],
  )

  return <GalleryThemeContext.Provider value={value}>{children}</GalleryThemeContext.Provider>
}

/** The active preset and a setter, for the header picker and the Themes page. */
export function useGalleryTheme(): GalleryThemeValue {
  const value = useContext(GalleryThemeContext)
  if (!value) throw new Error('useGalleryTheme must be used inside <GalleryThemeProvider>')
  return value
}
