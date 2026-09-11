import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [react(), dts({ tsconfigPath: './tsconfig.json', outDir: 'dist', rollupTypes: true })],
  build: {
    lib: {
      entry: {
        index: 'src/index.ts',
        virtualized: 'src/virtualized.tsx',
        recharts: 'src/recharts.ts',
      },
      formats: ['es', 'cjs'],
      fileName: (format, name) => (format === 'es' ? `${name}.js` : `${name}.cjs`),
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'recharts',
        /^@radix-ui\//,
        /^@tanstack\//,
        /^@shining-ui-kit\//,
        'clsx',
        'tailwind-merge',
        'class-variance-authority',
      ],
      output: {
        // The entire package is client-side; keep Next.js App Router happy.
        banner: "'use client';",
      },
    },
    sourcemap: true,
    target: 'es2021',
    cssCodeSplit: false,
  },
})
