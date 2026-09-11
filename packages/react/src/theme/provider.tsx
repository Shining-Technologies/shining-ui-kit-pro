import {
  applyBrand,
  defaultPalette,
  paletteById,
  resolveProject,
  themeToCssVars,
  type BrandInput,
  type ColorMode,
  type PresetId,
  type ProjectDefinition,
  type ProjectInput,
  type ProjectRegistry,
} from '@shining-technologies/ui-kit-core'
import {
  createContext,
  useCallback,
  useContext,
  useId,
  useInsertionEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { cn } from '../lib/cn'
import { useHydrated } from '../lib/use-hydrated'
import { UIKitContext, type ColorModePreference, type UIKitContextValue } from './context'
import {
  claimRoot,
  releaseRoot,
  rootStyleSheet,
  scopedStyleSheet,
  styleDeclarations,
} from './global-root'

export interface UIKitProviderProps {
  children: ReactNode
  /**
   * A shipped design to start from: colours, shape, density and type.
   * Defaults to `'shining'`.
   *
   * ```tsx
   * <UIKitProvider preset="darwind" />
   * ```
   */
  preset?: PresetId | (string & Record<never, never>)
  /**
   * Your brand on top of `preset`: a primary colour, or a flat object of
   * colour, shape and type tweaks. Anything you leave out keeps the preset's
   * value, and contrast is still guaranteed for every colour you pass.
   *
   * ```tsx
   * <UIKitProvider brand="#be123c" />
   * <UIKitProvider preset="unn" brand={{ primary: '#be123c', radius: '0.5rem' }} />
   * ```
   */
  brand?: BrandInput
  /**
   * The full project to paint with — a definition, or the id of a preset or of
   * a project in `registry`. Takes precedence over `preset` and `brand`.
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
   * projects can be previewed side by side; dialogs, menus and tooltips render
   * inside that wrapper so they are themed too. `'global'` writes the tokens
   * onto `<html>` instead, which also themes the page background and anything
   * of your own rendered outside the provider.
   */
  scope?: 'local' | 'global'
  /**
   * A server render carries the tokens in a `<style>` so the first paint is
   * already themed — always in `global` scope, and in `local` scope with
   * `mode="system"`, which an inline style cannot express. Components under
   * the provider use it too (the sidebar's custom `mobileBreakpoint`). Pass
   * your Content-Security-Policy nonce here if the policy forbids inline
   * styles without one.
   */
  nonce?: string

  /**
   * Added to the wrapper in `local` scope, and to `<html>` in `global` scope —
   * removed again on unmount, without touching classes the app set itself.
   * With nested global providers the innermost one's classes apply.
   */
  className?: string
  /**
   * Applied to the wrapper in `local` scope, and property by property to
   * `<html>` in `global` scope, where each is restored on unmount. Custom
   * properties here override the project's tokens.
   */
  style?: CSSProperties
}

const noopSubscribe = () => () => {}

/** How many providers are above this one, so the innermost global one wins `<html>`. */
const ProviderDepth = createContext(0)

const warned = new Set<string>()

/**
 * A mistyped id used to fall back to the default palette in silence, which
 * looks exactly like "the preset did nothing". Say so, once per id.
 */
function warnUnknown(prop: string, id: string) {
  const key = `${prop}:${id}`
  if (warned.has(key)) return
  warned.add(key)
  console.warn(
    `[shining-ui-kit] <UIKitProvider ${prop}="${id}">: no preset or project has that id. ` +
      `Falling back to "${defaultPalette.id}". Built-in presets: ${Object.keys(paletteById).join(', ')}.`,
  )
}

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
  preset,
  brand,
  project: controlledProject,
  defaultProject,
  onProjectChange,
  registry,
  mode: controlledMode,
  defaultMode = 'system',
  onModeChange,
  scope = 'local',
  nonce,
  className,
  style,
}: UIKitProviderProps) {
  const projects = useRegistryProjects(registry)

  /** Registry first (so a user's own projects win), then the shipped presets. */
  const lookup = useCallback(
    (id: string): ProjectDefinition | undefined =>
      registry?.get(id) ?? projects.find((p) => p.id === id) ?? paletteById[id],
    [registry, projects],
  )

  // `brand` is usually an inline object literal; key it by value so a
  // re-render does not regenerate the palette.
  const brandKey = brand === undefined ? '' : JSON.stringify(brand)
  const configured = preset !== undefined || brand !== undefined
  const base = useMemo(() => {
    const start = (preset !== undefined && lookup(preset)) || defaultPalette
    if (preset !== undefined && !lookup(preset)) warnUnknown('preset', preset)
    return brand === undefined ? start : applyBrand(start, brand)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, brandKey, lookup])

  const resolveRef = useCallback(
    (ref: ProjectDefinition | string | undefined): ProjectDefinition | undefined => {
      if (!ref) return undefined
      if (typeof ref !== 'string') return ref
      return ref === base.id ? base : lookup(ref)
    },
    [base, lookup],
  )

  // A pick made in this provider. The registry keeps its own active id as
  // well, so a project chosen in one provider is still chosen after a remount
  // or a reload.
  const [uncontrolledId, setUncontrolledId] = useState<string>()

  // The user's choice beats the app's configuration: `defaultProject`,
  // `preset` and `brand` are where a first visit starts, not an override of
  // what the user picked last time. That choice may have been restored from
  // localStorage, which the server never saw, so while hydrating it is left
  // out — and the registry's initial project stands in for its active one —
  // so the markup agrees with the server's; the restored project follows in
  // the very next commit. A client-only app never sees the difference.
  const hydrated = useHydrated()
  const chosenId = registry && hydrated ? registry.getChosenActiveId() : undefined
  const registryActive = registry
    ? hydrated
      ? registry.getActive()
      : (registry.get(registry.getInitialActiveId()) ?? registry.getActive())
    : undefined

  const project =
    resolveRef(controlledProject) ??
    resolveRef(uncontrolledId) ??
    resolveRef(chosenId) ??
    resolveRef(defaultProject) ??
    (configured ? base : registryActive) ??
    base

  for (const [label, ref] of [
    ['project', controlledProject],
    ['defaultProject', defaultProject],
  ] as const) {
    if (typeof ref === 'string' && !resolveRef(ref)) warnUnknown(label, ref)
  }

  // Local scope renders portalled surfaces into its own wrapper, so a dialog
  // opened from inside the provider is painted with the provider's tokens.
  const [scopeElement, setScopeElement] = useState<HTMLDivElement | null>(null)
  const portalContainer = scope === 'local' ? (scopeElement ?? undefined) : undefined

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
      const next = resolveRef(id)
      if (!next) return
      registry?.setActive(id)
      if (controlledProject === undefined) setUncontrolledId(id)
      onProjectChange?.(next)
    },
    [registry, resolveRef, controlledProject, onProjectChange],
  )

  // ------------------------------------------------------------- global scope
  // Written in an insertion effect so the variables land before the first paint
  // of anything below, rather than one frame after it. `<html>` is shared by
  // every global provider on the page; see `global-root.ts`.
  const depth = useContext(ProviderDepth)
  const owner = useRef({}).current
  // There is no wrapper to put `style` on, so it goes onto `<html>` alongside
  // the tokens — keyed by value, since it is usually an inline literal.
  const styleKey = style === undefined ? '' : JSON.stringify(style)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const declarations = useMemo(() => styleDeclarations(style), [styleKey])
  const rootVars = useMemo(() => ({ ...vars, ...declarations }), [vars, declarations])
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return
    if (scope !== 'global') return releaseRoot(owner)
    claimRoot(owner, {
      depth,
      vars: rootVars,
      mode: colorMode,
      project: project.id,
      density: project.shape.density,
      className,
    })
  }, [owner, scope, depth, rootVars, colorMode, project.id, project.shape.density, className])
  useInsertionEffect(() => () => releaseRoot(owner), [owner])

  // The server never runs the effect above; ship the tokens in its HTML.
  const rootSheet = useMemo(
    () =>
      scope === 'global' && !hydrated
        ? rootStyleSheet(
            { ...themeToCssVars(resolved.light), ...declarations },
            { ...themeToCssVars(resolved.dark), ...declarations },
            mode,
          )
        : null,
    [scope, hydrated, resolved, mode, declarations],
  )

  // ------------------------------------------------------------- local scope
  // An inline style cannot hold a media query, so a server render of
  // `mode="system"` would paint light and flash on a dark-OS machine. Until
  // hydration the wrapper instead carries both palettes in a `<style>` scoped
  // to it, the dark half behind `prefers-color-scheme`, as global scope does.
  const scopeId = useId()
  const pendingSystem = scope === 'local' && mode === 'system' && !hydrated
  const scopeSheet = useMemo(
    () =>
      pendingSystem
        ? scopedStyleSheet(
            `.sui-scope[data-sui-scope-id="${scopeId.replace(/["\\]/g, '\\$&')}"]`,
            themeToCssVars(resolved.light),
            themeToCssVars(resolved.dark),
            'system',
          )
        : null,
    [pendingSystem, scopeId, resolved],
  )

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
      portalContainer,
      nonce,
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
    [
      project,
      resolved,
      projects,
      mode,
      colorMode,
      setMode,
      setProject,
      portalContainer,
      nonce,
      registry,
    ],
  )

  if (scope === 'global') {
    return (
      <UIKitContext.Provider value={value}>
        <ProviderDepth.Provider value={depth + 1}>
          {rootSheet ? (
            <style data-sui-root="" nonce={nonce} dangerouslySetInnerHTML={{ __html: rootSheet }} />
          ) : null}
          {children}
        </ProviderDepth.Provider>
      </UIKitContext.Provider>
    )
  }

  return (
    <UIKitContext.Provider value={value}>
      <ProviderDepth.Provider value={depth + 1}>
        {scopeSheet ? (
          <style
            data-sui-scope-sheet=""
            nonce={nonce}
            dangerouslySetInnerHTML={{ __html: scopeSheet }}
          />
        ) : null}
        <div
          ref={setScopeElement}
          // While the sheet decides the mode, the wrapper claims neither side.
          className={cn('sui-scope', !pendingSystem && colorMode === 'dark' && 'dark', className)}
          data-sui-mode={pendingSystem ? undefined : colorMode}
          data-sui-scope-id={pendingSystem ? scopeId : undefined}
          data-sui-project={project.id}
          data-sui-density={project.shape.density}
          style={pendingSystem ? style : { ...(vars as CSSProperties), ...style }}
        >
          {children}
        </div>
      </ProviderDepth.Provider>
    </UIKitContext.Provider>
  )
}
