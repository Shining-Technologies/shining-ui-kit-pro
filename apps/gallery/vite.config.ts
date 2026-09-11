import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Run against sources so the docs site reloads on a library edit.
    // Order matters: subpaths must come before their package prefix.
    alias: [
      {
        find: '@shining-ui-kit/react/styles.css',
        replacement: r('../../packages/react/src/styles/index.css'),
      },
      {
        find: '@shining-ui-kit/react/virtualized',
        replacement: r('../../packages/react/src/virtualized.tsx'),
      },
      {
        find: '@shining-ui-kit/examples/examples.css',
        replacement: r('../../examples/src/examples.css'),
      },
      { find: '@shining-ui-kit/core', replacement: r('../../packages/core/src/index.ts') },
      { find: '@shining-ui-kit/react', replacement: r('../../packages/react/src/index.ts') },
      { find: '@shining-ui-kit/themes', replacement: r('../../packages/themes/src/index.ts') },
      {
        find: '@shining-ui-kit/export-csv',
        replacement: r('../../packages/export-csv/src/index.ts'),
      },
      { find: '@shining-ui-kit/examples', replacement: r('../../examples/src/index.ts') },
    ],
  },
  server: { port: 5180, open: true },
})
