/**
 * Deterministic 32-bit string hash (FNV-1a).
 *
 * Used to derive stable class names for generated theme stylesheets, so server
 * and client produce identical markup and hydration does not warn.
 */
export function stableHash(input: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(36)
}
