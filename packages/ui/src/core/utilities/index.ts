/** Read `"user.profile.name"` (and `"items.0.id"`) off an object, safely. */
export function getByPath(source: unknown, path: string): unknown {
  if (source === null || source === undefined) return undefined
  if (!path.includes('.')) return (source as Record<string, unknown>)[path]

  let current: unknown = source
  for (const segment of path.split('.')) {
    if (current === null || current === undefined) return undefined
    current = (current as Record<string, unknown>)[segment]
  }
  return current
}

/**
 * Deterministic 32-bit string hash (FNV-1a), base-36.
 *
 * For stable generated ids and class names that must match between a server
 * render and the hydrating client.
 */
export function stableHash(input: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(36)
}

/** `JSON.stringify` with deterministic key ordering. */
export function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_key, val: unknown) => {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      const source = val as Record<string, unknown>
      const sorted: Record<string, unknown> = {}
      for (const key of Object.keys(source).sort()) sorted[key] = source[key]
      return sorted
    }
    return val
  })
}
