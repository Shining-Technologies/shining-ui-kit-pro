import { isAbsolute } from 'node:path'
import { defineConfig, type Plugin } from 'vite'

/**
 * Same build shape as `@shining-technologies/ui`: one ES module per source
 * file, every bare import external, and each file's own `'use client'`
 * directive written back after Rollup strips it. `./design` stays server-safe
 * (no directive), so a Server Component or a route handler can build and check
 * designs without pulling in the editor.
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
      entry: { index: 'src/index.ts', design: 'src/design.ts' },
      formats: ['es'],
    },
    rollupOptions: {
      external: isExternal,
      preserveEntrySignatures: 'exports-only',
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
      },
      onwarn(warning, warn) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE' || warning.code === 'SOURCEMAP_ERROR') return
        warn(warning)
      },
    },
  },
})
