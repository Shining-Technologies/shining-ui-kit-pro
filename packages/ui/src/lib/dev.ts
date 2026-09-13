/**
 * Whether development-only warnings should run.
 *
 * The library build leaves `process.env.NODE_ENV` alone (Vite's library mode
 * does not replace `process.env`), so the consumer's bundler decides — which is
 * the point: an app's production build strips the warning. An unbundled
 * browser import has no `process` at all, and reading it throws; that is
 * treated as production rather than guessed at.
 */
export function isDevelopment(): boolean {
  try {
    return process.env.NODE_ENV !== 'production'
  } catch {
    return false
  }
}
