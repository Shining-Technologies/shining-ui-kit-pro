import { readdirSync } from 'node:fs'
import { isAbsolute } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'

/**
 * Every component family is its own entry (`@shining-technologies/ui/button`).
 * A barrel that only re-exports is otherwise flattened away by Rollup, which
 * leaves the `./*` export pointing at a file that does not exist.
 */
const componentEntries = Object.fromEntries(
  readdirSync(fileURLToPath(new URL('./src/components', import.meta.url)), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => [`components/${entry.name}/index`, `src/components/${entry.name}/index.ts`]),
)

/**
 * The build keeps one output file per source module, so each file carries its
 * own `'use client'` boundary instead of the whole package being marked as
 * client code, and bundlers can drop what an application never imports.
 *
 * Rollup strips module-level directives (and warns about it) even when modules
 * are preserved. This plugin records which sources declare `'use client'`
 * before any transform runs and writes the directive back onto exactly those
 * output files. It is prepended on the first line, so source maps stay aligned.
 */
const USE_CLIENT = /^(?:\s|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*['"]use client['"]/

function preserveUseClient(): Plugin {
  const clientModules = new Set<string>()
  return {
    name: 'shining:preserve-use-client',
    enforce: 'pre',
    transform(code, id) {
      if (/\.[cm]?[jt]sx?$/.test(id) && USE_CLIENT.test(code)) clientModules.add(id)
      return null
    },
    renderChunk(code, chunk) {
      const id = chunk.facadeModuleId
      if (!id || !clientModules.has(id)) return null
      return { code: `'use client';${code}`, map: null }
    },
  }
}

/** Every bare specifier (react, @radix-ui/*, recharts, …) stays an import. */
const isExternal = (id: string) =>
  !id.startsWith('.') && !id.startsWith('\0') && !isAbsolute(id) && !id.startsWith('/')

export default defineConfig({
  plugins: [preserveUseClient()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
    minify: false,
    sourcemap: true,
    lib: {
      entry: {
        index: 'src/index.ts',
        'core/index': 'src/core/index.ts',
        'theme/index': 'src/theme/index.ts',
        'charts/index': 'src/charts/index.ts',
        'csv/index': 'src/csv/index.ts',
        'components/data-table/virtualized': 'src/components/data-table/virtualized.tsx',
        ...componentEntries,
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: isExternal,
      // Components are reachable individually (`@shining-technologies/ui/button`).
      preserveEntrySignatures: 'exports-only',
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
      },
      onwarn(warning, warn) {
        // The directive warnings are expected (the plugin restores them), and
        // Rollup's failed attempt to map those warnings is noise.
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE' || warning.code === 'SOURCEMAP_ERROR') return
        warn(warning)
      },
    },
  },
})
