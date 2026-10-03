import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    // happy-dom, as in packages/ui; ProseMirror runs on it.
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 15_000,
    include: ['src/**/__tests__/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
})
