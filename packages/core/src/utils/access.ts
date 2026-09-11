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
