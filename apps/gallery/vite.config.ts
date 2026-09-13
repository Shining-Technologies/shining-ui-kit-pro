import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url))
const UI = r('../../packages/ui/src')

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Run against the package source so the gallery reloads on a library edit.
    // Order matters: subpaths must come before the package name itself.
    alias: [
      {
        find: '@shining-technologies/ui/virtualized',
        replacement: `${UI}/components/data-table/virtualized.tsx`,
      },
      { find: /^@shining-technologies\/ui\/(core|theme|charts|csv)$/, replacement: `${UI}/$1/index.ts` },
      { find: /^@shining-technologies\/ui\/([a-z-]+)$/, replacement: `${UI}/components/$1/index.ts` },
      { find: /^@shining-technologies\/ui$/, replacement: `${UI}/index.ts` },
    ],
    // The package source resolves its own React from packages/ui; one copy only.
    dedupe: ['react', 'react-dom'],
  },
  server: { port: 5180, open: true },
})
