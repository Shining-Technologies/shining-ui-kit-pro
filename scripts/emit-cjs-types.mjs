/**
 * Emit a `.d.cts` twin for every rolled-up `.d.ts` in a package's dist.
 *
 *   node scripts/emit-cjs-types.mjs packages/react/dist
 *
 * Why this exists: these packages are `"type": "module"`, so TypeScript reads
 * every `.d.ts` in them as an ES module. A CommonJS consumer that `require()`s
 * the package therefore gets CJS JavaScript described by ESM types — the
 * "masquerading as ESM" error, which breaks `import` statements the moment the
 * consumer sets `moduleResolution: "node16"`.
 *
 * The fix is a declaration file whose extension says CommonJS, pointed at by
 * the `require` condition. Because the declarations are rolled up (see
 * `rollupTypes` in each vite.config.ts) they contain no relative specifiers, so
 * the `.d.cts` is a byte-for-byte copy — there is nothing to rewrite, and
 * nothing that can drift between the two.
 */
import { copyFile, readdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'

const [dist] = process.argv.slice(2)
if (!dist) {
  console.error('usage: emit-cjs-types.mjs <dist-dir>')
  process.exit(1)
}

const dir = resolve(dist)
const declarations = (await readdir(dir)).filter(
  (file) => file.endsWith('.d.ts') && !file.endsWith('.d.cts'),
)

if (declarations.length === 0) {
  console.error(`no .d.ts files in ${dist} — did the build run?`)
  process.exit(1)
}

for (const file of declarations) {
  const twin = `${file.slice(0, -'.d.ts'.length)}.d.cts`
  await copyFile(join(dir, file), join(dir, twin))
  console.error(`dts -> ${twin}`)
}
