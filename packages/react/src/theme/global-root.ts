import type { ColorMode } from '@shining-technologies/ui-kit-core'
import type { CSSProperties } from 'react'

/*
 * `<html>` is one element and a page can mount several `scope="global"`
 * providers — an app-wide one, and a nested one that rebrands a section. Each
 * used to write straight onto it and delete what it wrote on unmount, so the
 * inner one unmounting stripped the outer one's tokens and left the page
 * unthemed. Providers now *claim* the root; the deepest claim (the latest, on a
 * tie) is what `<html>` shows, and releasing the last one hands back exactly
 * what was there before the first.
 */

export interface RootClaim {
  /** How many providers are above this one. Deeper wins. */
  depth: number
  /** Custom properties and, from the provider's `style`, plain declarations. */
  vars: Record<string, string>
  mode: ColorMode
  project: string
  density: string
  /** The provider's `className`, added to `<html>` while this claim wins. */
  className?: string
}

interface Entry extends RootClaim {
  order: number
}

interface Baseline {
  dark: boolean
  scope: boolean
  dataset: Record<'suiMode' | 'suiProject' | 'suiDensity', string | undefined>
  /** The inline value each custom property had before we first wrote it. */
  props: Map<string, string>
}

const claims = new Map<object, Entry>()
let counter = 0
let baseline: Baseline | null = null
let written = new Set<string>()
/**
 * Classes a claim's `className` put on `<html>`. Only these are ever removed:
 * a class the app had set already is the app's, even when a claim names it.
 */
let addedClasses = new Set<string>()

const DATASET_KEYS = ['suiMode', 'suiProject', 'suiDensity'] as const
/** Managed through the mode and the scope; a `className` does not get to toggle them. */
const OWN_CLASSES = new Set(['dark', 'sui-scope'])

export function claimRoot(owner: object, claim: RootClaim): void {
  claims.set(owner, { ...claim, order: claims.get(owner)?.order ?? ++counter })
  apply()
}

export function releaseRoot(owner: object): void {
  if (claims.delete(owner)) apply()
}

function apply() {
  const root = document.documentElement
  baseline ??= {
    dark: root.classList.contains('dark'),
    scope: root.classList.contains('sui-scope'),
    dataset: {
      suiMode: root.dataset.suiMode,
      suiProject: root.dataset.suiProject,
      suiDensity: root.dataset.suiDensity,
    },
    props: new Map(),
  }
  const base = baseline

  let winner: Entry | undefined
  for (const claim of claims.values()) {
    if (
      !winner ||
      claim.depth > winner.depth ||
      (claim.depth === winner.depth && claim.order > winner.order)
    ) {
      winner = claim
    }
  }

  const restore = (name: string) => {
    const previous = base.props.get(name)
    if (previous) root.style.setProperty(name, previous)
    else root.style.removeProperty(name)
  }

  if (!winner) {
    for (const name of written) restore(name)
    applyClasses(root, [])
    root.classList.toggle('dark', base.dark)
    root.classList.toggle('sui-scope', base.scope)
    for (const key of DATASET_KEYS) {
      const previous = base.dataset[key]
      if (previous === undefined) delete root.dataset[key]
      else root.dataset[key] = previous
    }
    written = new Set()
    baseline = null
    return
  }

  for (const name of written) if (!(name in winner.vars)) restore(name)
  for (const [name, value] of Object.entries(winner.vars)) {
    if (!base.props.has(name)) base.props.set(name, root.style.getPropertyValue(name))
    root.style.setProperty(name, value)
  }
  written = new Set(Object.keys(winner.vars))
  applyClasses(root, winner.className?.split(/\s+/).filter(Boolean) ?? [])

  // `.dark` as well as the data attribute: consumers style their own markup
  // with Tailwind's `dark:` variant, which only looks at the class.
  root.classList.toggle('dark', winner.mode === 'dark')
  // The same ground the local wrapper gets: page surface, type, the focus
  // ring and the reduced-motion rule all hang off `.sui-scope`.
  root.classList.add('sui-scope')
  root.dataset.suiMode = winner.mode
  root.dataset.suiProject = winner.project
  root.dataset.suiDensity = winner.density
}

/** Put the winning claim's classes on `<html>`, and take back the ones it no longer names. */
function applyClasses(root: HTMLElement, names: string[]) {
  const wanted = new Set(names.filter((name) => !OWN_CLASSES.has(name)))
  for (const name of addedClasses) if (!wanted.has(name)) root.classList.remove(name)
  const next = new Set<string>()
  for (const name of wanted) {
    if (addedClasses.has(name) || !root.classList.contains(name)) {
      root.classList.add(name)
      next.add(name)
    }
  }
  addedClasses = next
}

/** Properties React leaves unitless when given a number. */
const UNITLESS = new Set([
  'animationIterationCount',
  'aspectRatio',
  'columnCount',
  'flex',
  'flexGrow',
  'flexShrink',
  'fontWeight',
  'gridColumn',
  'gridRow',
  'lineHeight',
  'opacity',
  'order',
  'orphans',
  'scale',
  'widows',
  'zIndex',
  'zoom',
])

/**
 * A React `style` object as CSS declarations — `backgroundColor: 'x'` as
 * `background-color: x`, a number in px where React would add them — so the
 * global provider can set each property on `<html>` individually.
 */
export function styleDeclarations(style: CSSProperties | undefined): Record<string, string> {
  const out: Record<string, string> = {}
  if (!style) return out
  for (const [key, value] of Object.entries(style) as [string, unknown][]) {
    if (value === undefined || value === null || value === '' || typeof value === 'boolean') {
      continue
    }
    const custom = key.startsWith('--')
    const name = custom
      ? key
      : key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`).replace(/^ms-/, '-ms-')
    out[name] =
      typeof value === 'number' && value !== 0 && !custom && !UNITLESS.has(key)
        ? `${value}px`
        : String(value)
  }
  return out
}

/**
 * The tokens as a stylesheet, for the server's HTML.
 *
 * On the client, `<html>` is written in an insertion effect — which a server
 * render never runs, so a server-rendered page would paint the stylesheet's
 * default palette until the bundle hydrated. Four `:root`s outrank every
 * selector the default tokens use, `.dark` and the OS dark-mode rule included.
 * `'system'` ships both halves behind the media query, so a dark-OS reader
 * does not see a light first frame either.
 */
export function rootStyleSheet(
  light: Record<string, string>,
  dark: Record<string, string>,
  mode: ColorMode | 'system',
): string {
  return scopedStyleSheet(':root:root:root:root', light, dark, mode)
}

/**
 * The same, for any selector — the local-scope wrapper uses it while it is
 * still server HTML, since an inline `style` cannot hold a media query.
 */
export function scopedStyleSheet(
  selector: string,
  light: Record<string, string>,
  dark: Record<string, string>,
  mode: ColorMode | 'system',
): string {
  const block = (vars: Record<string, string>, scheme: ColorMode) =>
    `${selector}{${Object.entries(vars)
      .map(([name, value]) => `${name}:${value}`)
      .join(';')};color-scheme:${scheme}}`

  const css =
    mode === 'system'
      ? `${block(light, 'light')}@media (prefers-color-scheme: dark){${block(dark, 'dark')}}`
      : block(mode === 'dark' ? dark : light, mode)
  // Token values can come from stored, user-authored projects: never let one
  // close the element. `\3c ` is `<` escaped for CSS.
  return css.replace(/</g, '\\3c ')
}
