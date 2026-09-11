import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [dts({ tsconfigPath: './tsconfig.json', outDir: 'dist', rollupTypes: true })],
  build: {
    lib: {
      entry: { index: 'src/index.ts' },
      formats: ['es', 'cjs'],
      fileName: (format, name) => (format === 'es' ? `${name}.js` : `${name}.cjs`),
    },
    rollupOptions: { external: [/^@tanstack\//, /^@shining-technologies\/ui-kit-/] },
    sourcemap: true,
    target: 'es2021',
  },
})
