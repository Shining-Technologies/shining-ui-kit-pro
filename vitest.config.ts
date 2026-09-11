import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shining-technologies/ui-kit-core': r('./packages/core/src/index.ts'),
      '@shining-technologies/ui-kit-react/styles.css': r('./tests/style-stub.css'),
      '@shining-technologies/ui-kit-react/virtualized': r('./packages/react/src/virtualized.tsx'),
      '@shining-technologies/ui-kit-react/recharts': r('./packages/react/src/recharts.ts'),
      '@shining-technologies/ui-kit-react': r('./packages/react/src/index.ts'),
      '@shining-technologies/ui-kit-themes': r('./packages/themes/src/index.ts'),
      '@shining-technologies/ui-kit-export-csv': r('./packages/export-csv/src/index.ts'),
      '@shining-technologies/ui-kit-examples': r('./examples/src/index.ts'),
    },
  },
  test: {
    globals: true,
    // happy-dom, not jsdom: Radix's popper stack (Popover, DropdownMenu, Select)
    // never opens under jsdom here and hangs the run for ~45s per interaction.
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    // Fail a stuck interaction fast instead of stalling the whole run.
    testTimeout: 15_000,
    hookTimeout: 15_000,
    include: ['packages/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['packages/*/src/**/*.{ts,tsx}'],
      exclude: ['**/*.stories.tsx', '**/index.ts', '**/*.d.ts'],
    },
  },
})
