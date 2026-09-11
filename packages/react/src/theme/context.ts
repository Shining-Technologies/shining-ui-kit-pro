import type {
  ColorMode,
  Density,
  ProjectDefinition,
  ProjectInput,
  ProjectRegistry,
  ResolvedProject,
} from '@shining-ui-kit/core'
import { createContext, useContext } from 'react'

/** `system` follows the OS until the user picks a side. */
export type ColorModePreference = ColorMode | 'system'

export interface UIKitContextValue {
  /** The project every component in this scope is currently painted with. */
  project: ProjectDefinition
  /** Its generated tokens, for both modes. */
  resolved: ResolvedProject
  /** Every project available to switch to. */
  projects: ProjectDefinition[]
  /** What was asked for — may be `'system'`. */
  mode: ColorModePreference
  /** What is actually being rendered. Never `'system'`. */
  colorMode: ColorMode
  density: Density

  setMode: (mode: ColorModePreference) => void
  /** Switch project by id. Unknown ids are ignored rather than blanking the UI. */
  setProject: (id: string) => void

  /** Project management, present only when the provider was given a registry. */
  registry?: ProjectRegistry
  createProject?: (input: ProjectInput) => ProjectDefinition
  updateProject?: (id: string, patch: Partial<ProjectInput>) => ProjectDefinition
  deleteProject?: (id: string) => boolean
  forkProject?: (id: string, name: string) => ProjectDefinition
}

export const UIKitContext = createContext<UIKitContextValue | null>(null)

/**
 * Read the active project and colour mode.
 *
 * Throws rather than returning a default: a component that silently rendered
 * with the wrong palette because a provider was missing is far harder to spot
 * than one that says so.
 */
export function useUIKit(): UIKitContextValue {
  const value = useContext(UIKitContext)
  if (!value) {
    throw new Error('useUIKit() requires a <UIKitProvider> above it in the tree.')
  }
  return value
}

/** The active project, or `undefined` outside a provider. */
export function useProject(): ProjectDefinition | undefined {
  return useContext(UIKitContext)?.project
}

/** The colour mode actually rendering, and a setter. Safe outside a provider. */
export function useColorMode(): {
  colorMode: ColorMode
  mode: ColorModePreference
  setMode: (mode: ColorModePreference) => void
} {
  const value = useContext(UIKitContext)
  return {
    colorMode: value?.colorMode ?? 'light',
    mode: value?.mode ?? 'light',
    setMode: value?.setMode ?? (() => {}),
  }
}
