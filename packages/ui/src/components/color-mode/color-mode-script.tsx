/**
 * Colour mode without a provider.
 *
 * The theme is CSS: `.dark` on `<html>` switches every token. The only thing
 * JavaScript has to do is put that class on before the first paint, which is
 * this script's job. It is a Server Component — render it in `<head>`:
 *
 * ```tsx
 * // app/layout.tsx
 * <html lang="en" suppressHydrationWarning>
 *   <head>
 *     <ColorModeScript defaultMode="system" />
 *   </head>
 *   <body>{children}</body>
 * </html>
 * ```
 *
 * Already using `next-themes` (with `attribute="class"`)? Skip this and pass
 * its `resolvedTheme` to `<ColorModeToggle mode={…} onModeChange={setTheme} />`.
 */

/** `'system'` follows the operating system. */
export type ColorModePreference = 'light' | 'dark' | 'system'

/** What is actually painted. */
export type ResolvedColorMode = 'light' | 'dark'

export const DEFAULT_COLOR_MODE_STORAGE_KEY = 'sui-color-mode'

export interface ColorModeScriptOptions {
  /** `localStorage` key holding the preference. Defaults to `"sui-color-mode"`. */
  storageKey?: string
  /** Used when nothing is stored. Defaults to `'system'`. */
  defaultMode?: ColorModePreference
}

export interface ColorModeScriptProps extends ColorModeScriptOptions {
  /** Content-Security-Policy nonce, if inline scripts require one. */
  nonce?: string
}

const MODES: readonly ColorModePreference[] = ['light', 'dark', 'system']

/**
 * The script's source, for frameworks that inject head scripts themselves.
 * Safe to inline: the storage key cannot close the element.
 */
export function getColorModeScript({
  storageKey = DEFAULT_COLOR_MODE_STORAGE_KEY,
  defaultMode = 'system',
}: ColorModeScriptOptions = {}): string {
  const key = JSON.stringify(String(storageKey)).replace(/</g, '\\u003c')
  const fallback = JSON.stringify(MODES.includes(defaultMode) ? defaultMode : 'system')
  return (
    '(function(){try{var m=null;try{m=localStorage.getItem(' +
    key +
    ')}catch(e){}if(m!=="light"&&m!=="dark"&&m!=="system")m=' +
    fallback +
    ';var d=m==="dark"||(m==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);' +
    'var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light"}catch(e){}})()'
  )
}

/** Sets `.dark` on `<html>` before paint from the stored preference. */
export function ColorModeScript({ nonce, ...options }: ColorModeScriptProps) {
  return (
    <script
      nonce={nonce}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: getColorModeScript(options) }}
    />
  )
}
