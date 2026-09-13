import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const r = (path: string) => fileURLToPath(new URL(path, import.meta.url))

/**
 * Tests import the package by its public name, so they exercise the same entry
 * points an application does. The aliases point those names at source.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@shining-technologies/ui/styles.css', replacement: r('./tests/style-stub.css') },
      {
        find: '@shining-technologies/ui/virtualized',
        replacement: r('./src/components/data-table/virtualized.tsx'),
      },
      { find: /^@shining-technologies\/ui\/(core|theme|charts|csv)$/, replacement: `${r('./src')}/$1/index.ts` },
      { find: /^@shining-technologies\/ui\/([a-z-]+)$/, replacement: `${r('./src/components')}/$1/index.ts` },
      { find: /^@shining-technologies\/ui$/, replacement: r('./src/index.ts') },
    ],
  },
  test: {
    globals: true,
    // happy-dom, not jsdom: Radix popper interactions hang under jsdom.
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 15_000,
    hookTimeout: 15_000,
    include: ['src/**/__tests__/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
})
