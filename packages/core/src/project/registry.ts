import { createProject, forkProject, slugify, updateProject } from './create-project'
import { BUILT_IN_PALETTES, defaultPalette } from './palettes'
import type { ProjectDefinition, ProjectInput } from './types'

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
  /** Project id selected on first load. */
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
  private listeners = new Set<() => void>()
  /** Rebuilt on every mutation so `useSyncExternalStore` sees a new reference. */
  private snapshot: ProjectDefinition[] = []

  constructor(options: ProjectRegistryOptions = {}) {
    this.builtIns = options.builtIns ?? BUILT_IN_PALETTES
    this.storage = options.storage === null ? null : (options.storage ?? defaultStorage())
    this.storageKey = options.storageKey ?? STORAGE_KEY

    const restored = this.read()
    this.custom = restored?.projects ?? []
    this.activeId =
      options.initialProjectId ?? restored?.activeId ?? this.builtIns[0]?.id ?? defaultPalette.id
    this.refresh(false)
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
    return this.get(this.activeId) ?? this.builtIns[0] ?? defaultPalette
  }

  getActiveId(): string {
    return this.activeId
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
    if (this.activeId === id) this.activeId = this.builtIns[0]?.id ?? defaultPalette.id
    this.refresh()
    return true
  }

  setActive(id: string): void {
    if (this.activeId === id || !this.get(id)) return
    this.activeId = id
    this.refresh()
  }

  /** Drop every user project and go back to the shipped presets. */
  reset(): void {
    this.custom = []
    this.activeId = this.builtIns[0]?.id ?? defaultPalette.id
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

    const incoming = parsed.projects.map((p) => ({
      ...p,
      builtIn: false,
      id: this.uniqueId(p.id),
    }))
    this.custom = replace ? incoming : [...this.custom, ...incoming]
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
        activeId: this.activeId,
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
    const valid = projects.filter(
      (p): p is ProjectDefinition =>
        Boolean(p) && typeof p === 'object' && typeof p.id === 'string' && Boolean(p.seed?.primary),
    )
    return { version: 1, projects: valid, activeId: typeof activeId === 'string' ? activeId : '' }
  } catch {
    return null
  }
}

/** The registry an app gets when it does not build its own. */
export const globalProjectRegistry = /* @__PURE__ */ new ProjectRegistry()
