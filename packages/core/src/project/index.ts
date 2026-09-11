/**
 * Projects: named, serialisable design systems.
 *
 * A project is a few seed colours plus geometry and type choices. Resolving it
 * produces the full token set every component in the kit reads, so switching
 * project restyles an entire application rather than one component.
 */
export type {
  ColorMode,
  NeutralTint,
  ProjectDefinition,
  ProjectInput,
  ProjectSeed,
  ProjectShape,
  ProjectTypography,
  ResolvedProject,
} from './types'
export {
  DEFAULT_SHAPE,
  DEFAULT_TYPOGRAPHY,
  createProject,
  forkProject,
  resolveProject,
  slugify,
  updateProject,
} from './create-project'
export { generateColors } from './generate-palette'
export {
  BUILT_IN_PALETTES,
  defaultPalette,
  emberPalette,
  forestPalette,
  midnightPalette,
  monoPalette,
  paletteById,
  rosePalette,
  shiningPalette,
  slatePalette,
  violetPalette,
} from './palettes'
export { ProjectRegistry, globalProjectRegistry } from './registry'
export type { ProjectRegistryOptions, ProjectStorage } from './registry'
