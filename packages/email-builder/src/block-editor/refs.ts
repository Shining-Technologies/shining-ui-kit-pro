/**
 * A saved row's id as the server spells it: lower-case and hyphenated. A placeholder's ``ref`` may
 * be written in another form the server accepts (upper case, 32 hex digits, braces, ``urn:uuid:``),
 * so every lookup of a shared block goes through this. Anything that is not a UUID is only
 * lower-cased.
 */
export function canonicalRef(ref: string): string {
  const digits = ref
    .trim()
    .toLowerCase()
    .replace(/^urn:uuid:/, '')
    .replace(/^\{(.*)\}$/, '$1')
    .replace(/-/g, '')
  if (!/^[0-9a-f]{32}$/.test(digits)) return ref.trim().toLowerCase()
  return `${digits.slice(0, 8)}-${digits.slice(8, 12)}-${digits.slice(12, 16)}-${digits.slice(16, 20)}-${digits.slice(20)}`
}
