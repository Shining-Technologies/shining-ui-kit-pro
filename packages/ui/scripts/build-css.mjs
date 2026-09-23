// Build the distributable stylesheets.
//
//   dist/styles.css    theme + tokens + every component, layered and minified
//   dist/theme.css     the default theme values only
//   dist/tailwind.css  Tailwind v4 @theme mapping (not minified: Tailwind parses it)
//
// Layering is what lets applications win: the theme and tokens sit in `base`,
// every component rule in `components`, and the order statement matches
// Tailwind v4, so application utilities always beat kit rules.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import { transform } from 'esbuild'

const root = new URL('../', import.meta.url)
const read = (path) => readFile(new URL(path, root), 'utf8')
const write = async (path, content) => {
  await mkdir(new URL('./dist/', root), { recursive: true })
  await writeFile(new URL(path, root), content, 'utf8')
}

/** Component stylesheets, in dependency order: later files refine earlier ones. */
const COMPONENTS = [
  'base',
  'primitives',
  'surfaces',
  'forms',
  'navigation',
  'overlays',
  'charts-recharts',
  'theming',
  'table',
  'controls',
  'composites',
  'inputs',
  'shell',
  'sidebar',
  'layout',
  'data-display',
]

const LAYER_ORDER = '@layer theme, base, components, utilities;'
const withoutOrder = (css) => css.replaceAll(LAYER_ORDER, '')

const theme = await read('src/theme/theme.css')
const tokens = await read('src/theme/tokens.css')
const components = []
for (const name of COMPONENTS) {
  const css = await read(`src/styles/${name}.css`)
  if (/@import\b/.test(css)) throw new Error(`src/styles/${name}.css must not @import`)
  if (/@layer\b/.test(css)) throw new Error(`src/styles/${name}.css must not declare layers`)
  components.push(css)
}

const bundle = [
  LAYER_ORDER,
  withoutOrder(theme),
  withoutOrder(tokens),
  `@layer components {\n${components.join('\n')}\n}`,
].join('\n')

const { code, warnings } = await transform(bundle, { loader: 'css', minify: true, legalComments: 'none' })
for (const warning of warnings) console.error(`css warning: ${warning.text}`)

await write('dist/styles.css', code)
await write('dist/theme.css', theme)
await write('dist/tailwind.css', await read('src/theme/tailwind.css'))

const kb = (text) => `${(Buffer.byteLength(text) / 1024).toFixed(1)} kB`
console.error(
  `css -> dist/styles.css ${kb(code)} (gzip ${kb(gzipSync(code))}, source ${kb(bundle)}), theme.css, tailwind.css`,
)
