import { mergeThemes, type UIKitTheme } from '../theme/create-theme'
import type {
  BrandInput,
  BrandOptions,
  ProjectDefinition,
  ProjectInput,
  ProjectShape,
  ProjectTypography,
  ResolvedProject,
} from './types'
import { generateColors } from './generate-palette'

export const DEFAULT_SHAPE: ProjectShape = {
  radius: '0.65rem',
  density: 'comfortable',
  variant: 'default',
  borderWidth: '1px',
  elevation: 'soft',
}

export const DEFAULT_TYPOGRAPHY: ProjectTypography = {
  fontFamily:
    "'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  fontFamilyMono:
    "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
  fontSize: '0.875rem',
  titleFontWeight: '600',
}

/** Lowercase, dash-separated, safe as a storage key and a `data-` attribute value. */
export function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64) || 'project'
  )
}

/**
 * Build a complete project from a partial description.
 *
 * The only required fields are a name and a primary colour; everything else has
 * a defensible default, so `createProject({ name: 'Acme', seed: { primary: '#7c3aed' } })`
 * is a finished, usable design system.
 */
export function createProject(input: ProjectInput): ProjectDefinition {
  const now = new Date().toISOString()
  return {
    id: input.id ?? slugify(input.name),
    name: input.name,
    description: input.description,
    basePalette: input.basePalette,
    seed: { ...input.seed },
    neutralTint: input.neutralTint ?? 'subtle',
    shape: { ...DEFAULT_SHAPE, ...input.shape },
    typography: { ...DEFAULT_TYPOGRAPHY, ...input.typography },
    overrides: input.overrides,
    builtIn: input.builtIn,
    createdAt: input.builtIn ? undefined : now,
    updatedAt: input.builtIn ? undefined : now,
  }
}

/** Apply a partial edit, refreshing `updatedAt`. Nested groups merge, not replace. */
export function updateProject(
  project: ProjectDefinition,
  patch: Partial<ProjectInput>,
): ProjectDefinition {
  return {
    ...project,
    ...patch,
    id: project.id,
    seed: { ...project.seed, ...patch.seed },
    shape: { ...project.shape, ...patch.shape },
    typography: { ...project.typography, ...patch.typography },
    overrides: patch.overrides
      ? (mergeThemes(project.overrides, patch.overrides) as UIKitTheme)
      : project.overrides,
    // A project that has been edited is no longer the shipped preset it copied.
    builtIn: false,
    updatedAt: new Date().toISOString(),
  }
}

/** Copy a project under a new name, so a preset can be used as a starting point. */
export function forkProject(project: ProjectDefinition, name: string): ProjectDefinition {
  return createProject({
    name,
    description: project.description,
    basePalette: project.basePalette ?? project.id,
    seed: project.seed,
    neutralTint: project.neutralTint,
    shape: project.shape,
    typography: project.typography,
    overrides: project.overrides,
  })
}

/**
 * Put a brand on a project: a colour, or a flat set of seed, shape and type
 * tweaks. Unset fields keep the base project's values.
 *
 * The result is a new project with its own id (`<base>-custom`), so it never
 * shadows the shipped preset it started from.
 *
 * ```ts
 * applyBrand(darwindPalette, '#be123c')
 * applyBrand(unnPalette, { primary: '#be123c', radius: '0.5rem', density: 'compact' })
 * ```
 */
export function applyBrand(base: ProjectDefinition, brand: BrandInput): ProjectDefinition {
  const options: BrandOptions = typeof brand === 'string' ? { primary: brand } : brand
  const {
    radius,
    density,
    elevation,
    borderWidth,
    variant,
    neutralTint,
    fontFamily,
    fontSize,
    titleFontWeight,
    overrides,
    ...seed
  } = options

  const shape = { radius, density, elevation, borderWidth, variant }
  const typography = { fontFamily, fontSize, titleFontWeight }

  return {
    ...base,
    id: `${base.id}-custom`,
    name: `${base.name} (custom)`,
    basePalette: base.basePalette ?? base.id,
    seed: { ...base.seed, ...defined(seed) },
    neutralTint: neutralTint ?? base.neutralTint,
    shape: { ...base.shape, ...defined(shape) },
    typography: { ...base.typography, ...defined(typography) },
    overrides: overrides ? (mergeThemes(base.overrides, overrides) as UIKitTheme) : base.overrides,
    builtIn: false,
  }
}

/** Drop `undefined` values so a spread never erases a base value. */
function defined<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, v]) => v !== undefined && v !== ''),
  ) as Partial<T>
}

const RADIUS_SCALE = (base: string) => ({
  base,
  small: `calc(${base} - 4px)`,
  control: `calc(${base} - 2px)`,
  table: base,
  large: `calc(${base} + 4px)`,
})

const ELEVATION = {
  flat: {
    surface: 'none',
    overlay: '0 0 0 1px rgb(0 0 0 / 0.06)',
    modal: '0 0 0 1px rgb(0 0 0 / 0.08)',
    pinnedLeft: 'none',
    pinnedRight: 'none',
  },
  soft: {
    surface: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    overlay: '0 4px 6px -1px rgb(0 0 0 / 0.06), 0 10px 22px -6px rgb(0 0 0 / 0.12)',
    modal: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 24px 48px -12px rgb(0 0 0 / 0.25)',
    pinnedLeft: '6px 0 8px -6px rgb(0 0 0 / 0.14)',
    pinnedRight: '-6px 0 8px -6px rgb(0 0 0 / 0.14)',
  },
  raised: {
    surface: '0 2px 4px -1px rgb(0 0 0 / 0.08), 0 6px 16px -8px rgb(0 0 0 / 0.14)',
    overlay: '0 8px 12px -3px rgb(0 0 0 / 0.1), 0 18px 36px -10px rgb(0 0 0 / 0.2)',
    modal: '0 16px 24px -6px rgb(0 0 0 / 0.16), 0 36px 64px -16px rgb(0 0 0 / 0.32)',
    pinnedLeft: '8px 0 12px -8px rgb(0 0 0 / 0.2)',
    pinnedRight: '-8px 0 12px -8px rgb(0 0 0 / 0.2)',
  },
} as const

/** The non-colour half of a project: geometry, rhythm and type. */
function shapeTokens(project: ProjectDefinition): Omit<UIKitTheme, 'colors' | 'dark'> {
  const { shape, typography } = project
  return {
    radius: RADIUS_SCALE(shape.radius),
    border: { width: shape.borderWidth },
    typography: {
      fontFamily: typography.fontFamily,
      fontFamilyMono: typography.fontFamilyMono,
      fontSize: typography.fontSize,
      titleFontWeight: typography.titleFontWeight,
    },
    density: shape.density,
    variant: shape.variant,
  }
}

/**
 * Resolve a project into the themes the provider writes as CSS variables.
 *
 * Both modes are generated eagerly: a colour-mode toggle then swaps one
 * attribute instead of re-running the palette generator, so it stays instant
 * even on a page with several themed scopes.
 */
export function resolveProject(project: ProjectDefinition): ResolvedProject {
  const shared = shapeTokens(project)
  // An unknown level (a typo, a stored project from elsewhere) used to throw.
  const elevation = ELEVATION[project.shape.elevation] ?? ELEVATION.soft

  const build = (mode: 'light' | 'dark'): UIKitTheme => ({
    ...shared,
    colors: generateColors(project.seed, project.neutralTint, mode),
    shadow:
      mode === 'light'
        ? { ...elevation }
        : {
            ...elevation,
            surface: elevation.surface === 'none' ? 'none' : '0 1px 2px 0 rgb(0 0 0 / 0.4)',
            overlay: '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 10px 24px -6px rgb(0 0 0 / 0.55)',
            modal: '0 16px 32px -8px rgb(0 0 0 / 0.6), 0 40px 72px -20px rgb(0 0 0 / 0.7)',
          },
  })

  const overrides = project.overrides
  const light = mergeThemes(build('light'), overrides) as UIKitTheme
  // A project's `dark` block is the dark-mode half of its overrides; the rest of
  // the override still applies to both modes.
  const dark = mergeThemes(
    mergeThemes(build('dark'), overrides) as UIKitTheme,
    overrides?.dark as UIKitTheme | undefined,
  ) as UIKitTheme

  return { project, light, dark }
}
