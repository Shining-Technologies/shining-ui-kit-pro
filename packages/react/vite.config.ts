import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

/**
 * vite-plugin-dts lifts every `declare module` block out of the sources and
 * appends it to each rolled-up entry — but not the imports those blocks use.
 * The `ColumnMeta` augmentation (src/types/module-augmentation.ts) therefore
 * landed in every `.d.ts` extending a name nothing declared: an error under
 * `skipLibCheck: false`, and a silently untyped `meta.align` everywhere else.
 * Put the import it needs back.
 */
const AUGMENTATION_IMPORT =
  "import type { ColumnMeta as ShiningColumnMeta } from '@shining-technologies/ui-kit-core';\n"

function restoreAugmentationImport(filePath: string, content: string) {
  if (!/\.d\.c?ts$/.test(filePath)) return
  if (!/\bextends ShiningColumnMeta\b/.test(content)) return
  if (/\bas ShiningColumnMeta\b/.test(content)) return
  return { content: AUGMENTATION_IMPORT + content }
}

export default defineConfig({
  plugins: [
    react(),
    dts({
      tsconfigPath: './tsconfig.json',
      outDir: 'dist',
      rollupTypes: true,
      beforeWriteFile: restoreAugmentationImport,
    }),
  ],
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
        /^@shining-technologies\/ui-kit-/,
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
