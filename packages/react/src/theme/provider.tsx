import {
  defaultPalette,
  resolveProject,
  themeToCssVars,
  type ColorMode,
  type ProjectDefinition,
  type ProjectInput,
  type ProjectRegistry,
} from '@shining-ui-kit/core'
import {
  useCallback,
  useEffect,
  useInsertionEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { cn } from '../lib/cn'
import { UIKitContext, type ColorModePreference, type UIKitContextValue } from './context'

export interface UIKitProviderProps {
  children: ReactNode
  /**
   * The project to paint with — a definition, or the id of one in `registry`.
   * Controlled when supplied together with `onProjectChange`.
   */
  project?: ProjectDefinition | string
  /** Project used before the user picks one. Ignored when `project` is set. */
  defaultProject?: ProjectDefinition | string
  onProjectChange?: (project: ProjectDefinition) => void

  /**
   * Where projects are stored and managed. Pass one to enable creating,
   * editing and deleting projects from the UI; omit it for a fixed theme.
   */
  registry?: ProjectRegistry

  /** Controlled colour mode. `'system'` follows the OS. */
  mode?: ColorModePreference
  defaultMode?: ColorModePreference
  onModeChange?: (mode: ColorModePreference) => void

  /**
   * `'local'` (default) scopes the tokens to a wrapper element, so several
   * projects can be previewed side by side. `'global'` writes them onto
   * `<html>` instead, which is what a real application wants — portalled
   * surfaces (dialogs, dropdowns, tooltips) then inherit them too.
   */
  scope?: 'local' | 'global'

  className?: string
  style?: CSSProperties
}

const noopSubscribe = () => () => {}

/** Watch the OS colour preference. Server-rendered as light. */
function useSystemColorMode(): ColorMode {
  const subscribe = useCallback((notify: () => void) => {
    if (typeof window === 'undefined' || !window.matchMedia) return () => {}
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    query.addEventListener('change', notify)
    return () => query.removeEventListener('change', notify)
  }, [])

  return useSyncExternalStore(
    typeof window === 'undefined' ? noopSubscribe : subscribe,
    () => (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
    () => 'light' as const,
  )
}

/** Subscribe to a registry's project list. */
function useRegistryProjects(registry: ProjectRegistry | undefined): ProjectDefinition[] {
  const subscribe = useCallback(
    (notify: () => void) => registry?.subscribe(notify) ?? (() => {}),
    [registry],
  )
  const empty = useRef<ProjectDefinition[]>([])
  return useSyncExternalStore(
    subscribe,
    () => registry?.list() ?? empty.current,
    () => registry?.list() ?? empty.current,
  )
}

/**
 * Make one project's tokens the design system for everything below it.
 *
 * The provider's whole job is to turn a project into CSS custom properties and
 * put them somewhere every component can read. Because nothing in the kit
 * hardcodes a colour, that single act is what makes switching project restyle
 * buttons, cards, charts and tables at once.
 */
export function UIKitProvider({
  children,
  project: controlledProject,
  defaultProject,
  onProjectChange,
  registry,
  mode: controlledMode,
  defaultMode = 'system',
  onModeChange,
  scope = 'local',
  className,
  style,
}: UIKitProviderProps) {
  const projects = useRegistryProjects(registry)

  const resolveRef = useCallback(
    (ref: ProjectDefinition | string | undefined): ProjectDefinition | undefined => {
      if (!ref) return undefined
      if (typeof ref !== 'string') return ref
      return registry?.get(ref) ?? projects.find((p) => p.id === ref)
    },
    [registry, projects],
  )

  // Uncontrolled selection lives here; the registry keeps its own active id so
  // a project chosen in one provider is still chosen after a remount.
  const [uncontrolledId, setUncontrolledId] = useState(
    () => resolveRef(defaultProject)?.id ?? registry?.getActiveId(),
  )

  const project =
    resolveRef(controlledProject) ??
    resolveRef(uncontrolledId) ??
    resolveRef(defaultProject) ??
    registry?.getActive() ??
    defaultPalette

  const [uncontrolledMode, setUncontrolledMode] = useState<ColorModePreference>(defaultMode)
  const mode = controlledMode ?? uncontrolledMode
  const systemMode = useSystemColorMode()
  const colorMode: ColorMode = mode === 'system' ? systemMode : mode

  const resolved = useMemo(() => resolveProject(project), [project])
  const theme = colorMode === 'dark' ? resolved.dark : resolved.light
  const vars = useMemo(() => themeToCssVars(theme), [theme])

  const setMode = useCallback(
    (next: ColorModePreference) => {
      if (controlledMode === undefined) setUncontrolledMode(next)
      onModeChange?.(next)
    },
    [controlledMode, onModeChange],
  )

  const setProject = useCallback(
    (id: string) => {
      const next = registry?.get(id) ?? projects.find((p) => p.id === id)
      if (!next) return
      registry?.setActive(id)
      if (controlledProject === undefined) setUncontrolledId(id)
      onProjectChange?.(next)
    },
    [registry, projects, controlledProject, onProjectChange],
  )

  // ------------------------------------------------------------- global scope
  // Written in an insertion effect so the variables land before the first paint
  // of anything below, rather than one frame after it.
  useInsertionEffect(() => {
    if (scope !== 'global' || typeof document === 'undefined') return
    const root = document.documentElement
    for (const [name, value] of Object.entries(vars)) root.style.setProperty(name, value)
    return () => {
      for (const name of Object.keys(vars)) root.style.removeProperty(name)
    }
  }, [scope, vars])

  useEffect(() => {
    if (scope !== 'global' || typeof document === 'undefined') return
    const root = document.documentElement
    const hadDark = root.classList.contains('dark')
    // `.dark` as well as the data attribute: consumers style their own markup
    // with Tailwind's `dark:` variant, which only looks at the class.
    root.classList.toggle('dark', colorMode === 'dark')
    root.dataset.suiMode = colorMode
    root.dataset.suiProject = project.id
    root.dataset.suiDensity = project.shape.density
    return () => {
      root.classList.toggle('dark', hadDark)
      delete root.dataset.suiMode
      delete root.dataset.suiProject
      delete root.dataset.suiDensity
    }
  }, [scope, colorMode, project.id, project.shape.density])

  const value = useMemo<UIKitContextValue>(
    () => ({
      project,
      resolved,
      projects: projects.length ? projects : [project],
      mode,
      colorMode,
      density: project.shape.density,
      setMode,
      setProject,
      registry,
      createProject: registry
        ? (input: ProjectInput) => {
            const created = registry.create(input)
            setProject(created.id)
            return created
          }
        : undefined,
      updateProject: registry
        ? (id: string, patch: Partial<ProjectInput>) => {
            const updated = registry.update(id, patch)
            // `update` on a built-in forks it; follow the fork so the user sees
            // their edit instead of the untouched preset.
            if (updated.id !== id) setProject(updated.id)
            return updated
          }
        : undefined,
      deleteProject: registry ? (id: string) => registry.remove(id) : undefined,
      forkProject: registry
        ? (id: string, name: string) => {
            const forked = registry.fork(id, name)
            setProject(forked.id)
            return forked
          }
        : undefined,
    }),
    [project, resolved, projects, mode, colorMode, setMode, setProject, registry],
  )

  if (scope === 'global') {
    return <UIKitContext.Provider value={value}>{children}</UIKitContext.Provider>
  }

  return (
    <UIKitContext.Provider value={value}>
      <div
        className={cn('sui-scope', colorMode === 'dark' && 'dark', className)}
        data-sui-mode={colorMode}
        data-sui-project={project.id}
        data-sui-density={project.shape.density}
        style={{ ...(vars as CSSProperties), ...style }}
      >
        {children}
      </div>
    </UIKitContext.Provider>
  )
}
