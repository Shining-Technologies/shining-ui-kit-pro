// Copy the editor's stylesheet into dist, minified. One file, layered in
// `components` like @shining-technologies/ui, so application styles win.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { transform } from 'esbuild'

const root = new URL('../', import.meta.url)
const source = await readFile(new URL('./src/styles.css', root), 'utf8')
const { code } = await transform(source, { loader: 'css', minify: true })
await mkdir(new URL('./dist/', root), { recursive: true })
await writeFile(new URL('./dist/styles.css', root), code, 'utf8')
console.log(`dist/styles.css ${code.length} bytes`)
