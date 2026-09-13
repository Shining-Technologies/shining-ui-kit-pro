import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// Imported in Node from the family entry: proves the colour-mode module loads outside a browser.
import { getColorModeScript } from '@shining-technologies/ui/color-mode'

function colorModeScript(): Plugin {
  return {
    name: 'sui-color-mode-script',
    transformIndexHtml(html) {
      return html.replace(
        '<!-- sui-color-mode-script -->',
        `<script>${getColorModeScript({ defaultMode: 'light' })}</script>`,
      )
    },
  }
}

export default defineConfig({
  plugins: [colorModeScript(), react(), tailwindcss()],
  preview: { port: 4173, strictPort: true },
  server: { port: 5173, strictPort: true },
})
