import {
  DEFAULT_SHAPE,
  DEFAULT_TYPOGRAPHY,
  createProject,
  forkProject,
  slugify,
  updateProject,
} from './create-project'
import { BUILT_IN_PALETTES, defaultPalette } from './palettes'
import type { NeutralTint, ProjectDefinition, ProjectInput } from './types'

/**
 * The set of projects an application knows about, plus which one is active.
 *
 * A tiny observable store rather than a React context: the registry has to be
 * readable from outside React (a route loader deciding the initial theme, a
 * server rendering the first paint) and it has to survive a remount, so the
 * source of truth lives here and React subscribes to it.
 */

export interface ProjectStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface ProjectRegistryOptions {
  /** Presets to seed with. Defaults to every built-in palette. */
  builtIns?: ProjectDefinition[]
  /** Where user projects persist. Pass `null` for an in-memory registry. */
  storage?: ProjectStorage | null
  storageKey?: string
  /**
   * Project id selected on first load. Once the user has picked a project and
   * it has been persisted, the persisted pick is restored instead.
   */
  initialProjectId?: string
}

interface PersistedState {
  version: 1
  projects: ProjectDefinition[]
  activeId: string
}

const STORAGE_KEY = 'shining-ui-kit:projects'

function defaultStorage(): ProjectStorage | null {
  try {
    // Access rather than existence: a browser set to block site data throws
    // *on read*, and a registry that throws would take the whole app down.
    if (typeof localStorage === 'undefined') return null
    localStorage.getItem(STORAGE_KEY)
    return localStorage
  } catch {
    return null
  }
}

export class ProjectRegistry {
  private readonly builtIns: ProjectDefinition[]
  private readonly storage: ProjectStorage | null
  private readonly storageKey: string
  private custom: ProjectDefinition[] = []
  private activeId: string
  private readonly initialActiveId: string
  /**
   * Whether `activeId` is a choice — restored from storage or set through
   * `setActive` — rather than the default. Only a choice is persisted, so a
   * write triggered by anything else cannot turn the default into a "pick"
   * that outranks the app's configured starting point on the next load.
   */
  private chosen = false
  private listeners = new Set<() => void>()
  /** Rebuilt on every mutation so `useSyncExternalStore` sees a new reference. */
  private snapshot: ProjectDefinition[] = []

  constructor(options: ProjectRegistryOptions = {}) {
    this.builtIns = options.builtIns ?? BUILT_IN_PALETTES
    this.storage = options.storage === null ? null : (options.storage ?? defaultStorage())
    this.storageKey = options.storageKey ?? STORAGE_KEY

    this.initialActiveId = options.initialProjectId ?? this.builtIns[0]?.id ?? defaultPalette.id
    const restored = this.read()
    this.custom = restored?.projects ?? []
    this.activeId = this.initialActiveId
    this.refresh(false)
    // `initialProjectId` is the first-load default only: the project the user
    // picked last time wins — as long as it still exists.
    if (restored?.activeId && this.get(restored.activeId)) {
      this.activeId = restored.activeId
      this.chosen = true
    }
  }

  // --------------------------------------------------------------- reading

  /** Built-in presets first, then user projects, both in insertion order. */
  list(): ProjectDefinition[] {
    return this.snapshot
  }

  get(id: string): ProjectDefinition | undefined {
    return this.snapshot.find((p) => p.id === id)
  }

  getActive(): ProjectDefinition {
    return (
      this.get(this.activeId) ??
      this.get(this.initialActiveId) ??
      this.builtIns[0] ??
      defaultPalette
    )
  }

  getActiveId(): string {
    return this.activeId
  }

  /**
   * The project that is active before anything is restored from storage —
   * `initialProjectId`, else the first built-in. A server render has no
   * storage, so this is what it paints; the provider paints it too while
   * hydrating, then switches to the restored project, so the two agree.
   */
  getInitialActiveId(): string {
    return this.initialActiveId
  }

  /**
   * The active id when it is a choice the user made — restored from storage,
   * or set with `setActive` — and `undefined` while it is still the default.
   * A provider ranks a choice above its `defaultProject`, `preset` and
   * `brand`, which are only where a first visit starts.
   */
  getChosenActiveId(): string | undefined {
    return this.chosen ? this.activeId : undefined
  }

  // -------------------------------------------------------------- mutating

  /** Add a project. Ids are made unique, so two "Acme"s can coexist. */
  create(input: ProjectInput): ProjectDefinition {
    const project = createProject({ ...input, id: this.uniqueId(input.id ?? slugify(input.name)) })
    this.custom = [...this.custom, project]
    this.refresh()
    return project
  }

  /** Copy an existing project — the flow behind "start from a preset". */
  fork(id: string, name: string): ProjectDefinition {
    const source = this.get(id)
    if (!source) throw new Error(`Unknown project: ${id}`)
    const project = { ...forkProject(source, name), id: this.uniqueId(slugify(name)) }
    this.custom = [...this.custom, project]
    this.refresh()
    return project
  }

  /**
   * Edit a project.
   *
   * Editing a built-in forks it rather than mutating the shipped preset, so the
   * presets stay a stable starting point and the user still gets their change.
   */
  update(id: string, patch: Partial<ProjectInput>): ProjectDefinition {
    const existing = this.get(id)
    if (!existing) throw new Error(`Unknown project: ${id}`)

    if (existing.builtIn) {
      const forked = {
        ...updateProject(existing, patch),
        id: this.uniqueId(`${existing.id}-custom`),
        name: patch.name ?? `${existing.name} (custom)`,
        basePalette: existing.id,
      }
      this.custom = [...this.custom, forked]
      if (this.activeId === id) this.activeId = forked.id
      this.refresh()
      return forked
    }

    const updated = updateProject(existing, patch)
    this.custom = this.custom.map((p) => (p.id === id ? updated : p))
    this.refresh()
    return updated
  }

  /** Remove a user project. Built-ins cannot be deleted. */
  remove(id: string): boolean {
    const existing = this.get(id)
    if (!existing || existing.builtIn) return false
    this.custom = this.custom.filter((p) => p.id !== id)
    if (this.activeId === id) {
      this.activeId = this.initialActiveId
      this.chosen = false
    }
    this.refresh()
    return true
  }

  setActive(id: string): void {
    if ((this.activeId === id && this.chosen) || !this.get(id)) return
    this.activeId = id
    this.chosen = true
    this.refresh()
  }

  /** Drop every user project and go back to the registry's initial project. */
  reset(): void {
    this.custom = []
    this.activeId = this.initialActiveId
    this.chosen = false
    this.refresh()
  }

  // ---------------------------------------------------------- portability

  /** Serialise user projects, for export to a file or a database row. */
  export(): string {
    return JSON.stringify({ version: 1, projects: this.custom, activeId: this.activeId }, null, 2)
  }

  /** Load exported projects. Unparseable input is rejected, not partially applied. */
  import(json: string, { replace = false } = {}): ProjectDefinition[] {
    const parsed = parseState(json)
    if (!parsed) throw new Error('Not a valid project export.')

    // One at a time, so ids are unique within the batch as well as against
    // what is already here (and only against what `replace` keeps).
    if (replace) this.custom = []
    const incoming: ProjectDefinition[] = []
    for (const p of parsed.projects) {
      const project = { ...p, builtIn: false, id: this.uniqueId(p.id) }
      incoming.push(project)
      this.custom = [...this.custom, project]
    }
    this.refresh()
    return incoming
  }

  // ------------------------------------------------------------ subscribing

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  // ------------------------------------------------------------- internals

  private uniqueId(base: string): string {
    const seed = slugify(base)
    if (!this.builtIns.some((p) => p.id === seed) && !this.custom.some((p) => p.id === seed)) {
      return seed
    }
    let n = 2
    while (
      this.builtIns.some((p) => p.id === `${seed}-${n}`) ||
      this.custom.some((p) => p.id === `${seed}-${n}`)
    ) {
      n++
    }
    return `${seed}-${n}`
  }

  private refresh(persist = true): void {
    this.snapshot = [...this.builtIns, ...this.custom]
    if (persist) this.write()
    for (const listener of this.listeners) listener()
  }

  private read(): PersistedState | null {
    if (!this.storage) return null
    try {
      const raw = this.storage.getItem(this.storageKey)
      return raw ? parseState(raw) : null
    } catch {
      return null
    }
  }

  private write(): void {
    if (!this.storage) return
    try {
      const state: PersistedState = {
        version: 1,
        projects: this.custom,
        // Empty unless chosen; see `chosen`.
        activeId: this.chosen ? this.activeId : '',
      }
      this.storage.setItem(this.storageKey, JSON.stringify(state))
    } catch {
      // A full or blocked quota must not break theming. The in-memory
      // registry is still correct; only the next reload loses the change.
    }
  }
}

function parseState(raw: string): PersistedState | null {
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    const { projects, activeId } = parsed as Partial<PersistedState>
    if (!Array.isArray(projects)) return null
    const valid = projects.map(normalizeProject).filter((p): p is ProjectDefinition => p !== null)
    return { version: 1, projects: valid, activeId: typeof activeId === 'string' ? activeId : '' }
  } catch {
    return null
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const TINTS: readonly NeutralTint[] = ['pure', 'subtle', 'tinted']

/**
 * A stored or imported project, made safe to resolve — or `null`.
 *
 * Storage outlives the code that wrote it: an older version's export, a
 * hand-edited file or another app's key can hold a project with no `shape` or
 * a seed colour that is not a string. Rendering one of those used to throw on
 * every page load, which is worse than dropping it; filling in the defaults
 * keeps what can be kept, the same way `createProject` does.
 */
function normalizeProject(value: unknown): ProjectDefinition | null {
  if (!isRecord(value) || typeof value.id !== 'string' || !value.id) return null
  if (!isRecord(value.seed) || typeof value.seed.primary !== 'string' || !value.seed.primary) {
    return null
  }
  const project = value as unknown as ProjectDefinition
  const seed = Object.fromEntries(
    Object.entries(value.seed).filter(([, colour]) => typeof colour === 'string'),
  ) as unknown as ProjectDefinition['seed']
  return {
    ...project,
    name: typeof value.name === 'string' && value.name ? value.name : value.id,
    seed,
    neutralTint: TINTS.includes(project.neutralTint) ? project.neutralTint : 'subtle',
    shape: { ...DEFAULT_SHAPE, ...(isRecord(value.shape) ? value.shape : null) },
    typography: {
      ...DEFAULT_TYPOGRAPHY,
      ...(isRecord(value.typography) ? value.typography : null),
    },
    overrides: isRecord(value.overrides) ? project.overrides : undefined,
  }
}

/** The registry an app gets when it does not build its own. */
export const globalProjectRegistry = /* @__PURE__ */ new ProjectRegistry()
