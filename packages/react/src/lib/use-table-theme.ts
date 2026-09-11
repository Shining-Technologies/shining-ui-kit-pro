import {
  cssVarsToDeclarations,
  stableHash,
  themeToCssVars,
  type TableTheme,
} from '@shining-technologies/ui-kit-core'
import { useInsertionEffect, useMemo, type CSSProperties } from 'react'

/** Ref-counted so several tables can share a theme without fighting over the tag. */
const injected = new Map<string, number>()

function buildDarkRule(className: string, declarations: string): string {
  const scope = `.${className}`
  return [
    `.dark ${scope},[data-theme="dark"] ${scope},${scope}[data-theme="dark"]{${declarations}}`,
    `@media (prefers-color-scheme:dark){`,
    `:root:not(.light):not([data-theme="light"]) ${scope}{${declarations}}`,
    `}`,
  ].join('')
}

/**
 * Turn a `theme` prop into inline CSS variables.
 *
 * Light values are inline, which is SSR-safe and needs no stylesheet. Dark-mode
 * overrides cannot be expressed inline — they depend on an ancestor selector —
 * so they go into a stylesheet keyed by a deterministic hash of their content.
 * The same theme therefore produces the same class name on server and client,
 * and hydration stays quiet (§28, §33).
 */
export function useTableTheme(theme: TableTheme | undefined) {
  const style = useMemo(() => themeToCssVars(theme) as CSSProperties, [theme])

  const dark = useMemo(() => {
    const vars = themeToCssVars(theme?.dark)
    const declarations = cssVarsToDeclarations(vars)
    if (!declarations) return undefined
    return { className: `sui-theme-${stableHash(declarations)}`, declarations }
  }, [theme])

  useInsertionEffect(() => {
    if (!dark || typeof document === 'undefined') return
    const count = injected.get(dark.className) ?? 0
    injected.set(dark.className, count + 1)

    if (count === 0) {
      const tag = document.createElement('style')
      tag.dataset.suiTheme = dark.className
      tag.textContent = buildDarkRule(dark.className, dark.declarations)
      document.head.appendChild(tag)
    }

    return () => {
      const remaining = (injected.get(dark.className) ?? 1) - 1
      if (remaining > 0) {
        injected.set(dark.className, remaining)
        return
      }
      injected.delete(dark.className)
      document.querySelector(`style[data-sui-theme="${dark.className}"]`)?.remove()
    }
  }, [dark])

  return { style, themeClassName: dark?.className }
}
