import { createProject } from './create-project'
import type { ProjectDefinition } from './types'

/**
 * The palettes a new project can start from.
 *
 * Each one is a seed, not a token dump — which means every preset gets the same
 * generated dark mode, the same contrast guarantees and the same chart family
 * as a fully custom project. Copy one with `forkProject()` and edit the seed.
 */

/**
 * The Shining Services portal, reproduced from its own tokens: deep pine green
 * with the orange used across its charts and highlights, on a warm off-white.
 */
export const shiningPalette: ProjectDefinition = createProject({
  id: 'shining',
  name: 'Shining',
  description:
    'Deep pine green and warm orange on an off-white page. The Shining Services house style.',
  builtIn: true,
  neutralTint: 'subtle',
  seed: {
    primary: '#01493b',
    accent: '#ff7f00',
    neutral: '#71717a',
    surface: '#fafaf7',
    success: '#15803d',
    warning: '#c2740a',
    info: '#0369a1',
  },
  shape: { radius: '0.65rem', density: 'comfortable', elevation: 'soft' },
})

/** Neutral greys and a confident blue. The safe default for an internal tool. */
export const slatePalette: ProjectDefinition = createProject({
  id: 'slate',
  name: 'Slate',
  description: 'Cool greys and a classic blue. Reads as neutral, works anywhere.',
  builtIn: true,
  neutralTint: 'subtle',
  seed: { primary: '#2563eb', accent: '#06b6d4', neutral: '#64748b' },
  shape: { radius: '0.5rem', density: 'comfortable', elevation: 'soft' },
})

/** Ink-dark chrome with a cyan brand. Made for dashboards that live in dark mode. */
export const midnightPalette: ProjectDefinition = createProject({
  id: 'midnight',
  name: 'Midnight',
  description: 'Navy-tinted greys and an electric cyan. Built to be read on a dark page.',
  builtIn: true,
  neutralTint: 'tinted',
  seed: { primary: '#38bdf8', accent: '#818cf8', neutral: '#475569', surface: '#f1f5f9' },
  shape: { radius: '0.75rem', density: 'comfortable', elevation: 'raised' },
})

/** Warm and editorial: terracotta on paper. */
export const emberPalette: ProjectDefinition = createProject({
  id: 'ember',
  name: 'Ember',
  description: 'Terracotta and amber on warm paper. Softer than a standard admin palette.',
  builtIn: true,
  neutralTint: 'tinted',
  seed: { primary: '#c2410c', accent: '#eab308', neutral: '#78716c', surface: '#fdfbf7' },
  shape: { radius: '0.875rem', density: 'spacious', elevation: 'soft' },
})

/** Violet on near-white, tight geometry. A product-marketing look. */
export const violetPalette: ProjectDefinition = createProject({
  id: 'violet',
  name: 'Violet',
  description: 'Saturated violet with a magenta second series. Modern SaaS.',
  builtIn: true,
  neutralTint: 'subtle',
  seed: { primary: '#7c3aed', accent: '#ec4899', neutral: '#6b7280' },
  shape: { radius: '0.75rem', density: 'comfortable', elevation: 'soft' },
})

/** Forest green, dense rows, flat chrome. For data-heavy back offices. */
export const forestPalette: ProjectDefinition = createProject({
  id: 'forest',
  name: 'Forest',
  description: 'Deep green, compact rows and flat chrome. Maximum rows per screen.',
  builtIn: true,
  neutralTint: 'subtle',
  seed: { primary: '#047857', accent: '#84cc16', neutral: '#57534e' },
  shape: { radius: '0.375rem', density: 'compact', elevation: 'flat', variant: 'dashboard' },
})

/** No brand colour at all: pure greyscale, hairline rules, zero radius. */
export const monoPalette: ProjectDefinition = createProject({
  id: 'mono',
  name: 'Mono',
  description: 'Greyscale, square corners, no elevation. Lets the content carry the page.',
  builtIn: true,
  neutralTint: 'pure',
  seed: { primary: '#18181b', accent: '#71717a', neutral: '#71717a' },
  shape: { radius: '0.125rem', density: 'compact', elevation: 'flat', variant: 'minimal' },
})

/** Rose on a blush page, generous spacing. */
export const rosePalette: ProjectDefinition = createProject({
  id: 'rose',
  name: 'Rose',
  description: 'Rose and coral on a blush page, with room to breathe.',
  builtIn: true,
  neutralTint: 'tinted',
  seed: { primary: '#e11d48', accent: '#fb923c', neutral: '#79716f', surface: '#fdf8f8' },
  shape: { radius: '1rem', density: 'spacious', elevation: 'raised' },
})

/**
 * Indigo and amber on cool white, square-ish corners, dense striped rows and
 * no shadows. Technical and precise: operations consoles, logistics, finance.
 */
export const darwindPalette: ProjectDefinition = createProject({
  id: 'darwind',
  name: 'Darwind',
  description: 'Indigo and amber, sharp corners, dense striped rows. Crisp and technical.',
  builtIn: true,
  neutralTint: 'subtle',
  seed: {
    primary: '#3730a3',
    accent: '#f59e0b',
    neutral: '#64748b',
    surface: '#f8fafc',
    info: '#0284c7',
  },
  shape: {
    radius: '0.25rem',
    density: 'compact',
    elevation: 'flat',
    variant: 'striped',
    borderWidth: '1px',
  },
  typography: {
    fontFamily:
      "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    titleFontWeight: '700',
  },
})

/**
 * Teal and coral on warm paper, very round corners, generous spacing and lifted
 * surfaces. Friendly and calm: customer portals, education, healthcare.
 */
export const unnPalette: ProjectDefinition = createProject({
  id: 'unn',
  name: 'Unn',
  description: 'Teal and coral, rounded corners, airy spacing. Soft and approachable.',
  builtIn: true,
  neutralTint: 'tinted',
  seed: {
    primary: '#0f766e',
    accent: '#f97362',
    neutral: '#78716c',
    surface: '#fbfaf7',
  },
  shape: {
    radius: '1.25rem',
    density: 'spacious',
    elevation: 'raised',
    variant: 'borderless',
    borderWidth: '1px',
  },
  typography: {
    fontSize: '0.9375rem',
    titleFontWeight: '500',
  },
})

export const BUILT_IN_PALETTES: ProjectDefinition[] = [
  shiningPalette,
  slatePalette,
  midnightPalette,
  violetPalette,
  emberPalette,
  forestPalette,
  rosePalette,
  monoPalette,
  darwindPalette,
  unnPalette,
]

/** Ids of the shipped presets, for autocompletion on `<UIKitProvider preset>`. */
export type PresetId =
  | 'shining'
  | 'slate'
  | 'midnight'
  | 'violet'
  | 'ember'
  | 'forest'
  | 'rose'
  | 'mono'
  | 'darwind'
  | 'unn'

export const paletteById: Record<string, ProjectDefinition> = Object.fromEntries(
  BUILT_IN_PALETTES.map((p) => [p.id, p]),
)

/** The project used when an app has not chosen one. */
export const defaultPalette = shiningPalette
