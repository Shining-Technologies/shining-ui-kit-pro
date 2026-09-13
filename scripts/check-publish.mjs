/**
 * Pre-publish preflight for the workspace's publishable packages.
 *
 * `npm publish` is happy to push a package whose `exports` map points at files
 * that were never built, or whose `dist` is a week older than `src`. Both
 * mistakes are silent until somebody installs the result, so they are checked
 * here instead — once, from the root, before anything leaves the machine.
 *
 *   node scripts/check-publish.mjs
 *
 * Exits non-zero on the first failing package, printing every problem it found
 * rather than only the first.
 */
import { readdir, readFile, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const packagesDir = join(root, 'packages')

/** Fields npm will not invent for you and that a public package should carry. */
const REQUIRED_FIELDS = ['name', 'version', 'description', 'license', 'repository', 'files']

const problems = []
const notes = []

function fail(pkg, message) {
  problems.push(`${pkg}: ${message}`)
}

/** Every file path mentioned by `main`, `module`, `types` and `exports`. */
function entryPaths(manifest) {
  const found = new Set()
  for (const key of ['main', 'module', 'types']) {
    if (typeof manifest[key] === 'string') found.add(manifest[key])
  }
  const walk = (node) => {
    if (typeof node === 'string') {
      if (node.startsWith('./')) found.add(node)
      return
    }
    if (node && typeof node === 'object') for (const value of Object.values(node)) walk(value)
  }
  walk(manifest.exports)
  return [...found]
}

/** The newest mtime under `dir`, or 0 when the directory does not exist. */
async function newestMtime(dir) {
  if (!existsSync(dir)) return 0
  let newest = 0
  const entries = await readdir(dir, { withFileTypes: true, recursive: true })
  for (const entry of entries) {
    if (!entry.isFile()) continue
    const { mtimeMs } = await stat(join(entry.parentPath ?? entry.path, entry.name))
    if (mtimeMs > newest) newest = mtimeMs
  }
  return newest
}

/**
 * Type-check the shipped declarations themselves, the way a consumer with
 * `skipLibCheck: false` would.
 *
 * `attw` proves each entry *resolves*; it does not prove the file it resolves
 * to is valid. A rolled-up `.d.ts` can reference a name its bundler dropped —
 * the `ColumnMeta` augmentation once did exactly that — and every consumer then
 * gets a hard error or, with `skipLibCheck`, a silently untyped API. Only our
 * own files are checked; errors inside third-party typings are not ours to fix.
 */
function declarationErrors(dir) {
  const dist = join(dir, 'dist')
  if (!existsSync(dist)) return []
  // `.d.cts` files are byte-for-byte copies (scripts/emit-cjs-types.mjs).
  const roots = ts.sys.readDirectory(dist, ['.d.ts'], undefined, undefined, 1)
  if (roots.length === 0) return []
  const program = ts.createProgram(roots, {
    noEmit: true,
    strict: true,
    skipLibCheck: false,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    lib: ['lib.es2022.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
    types: [],
  })
  const own = program.getSourceFiles().filter((file) => resolve(file.fileName).startsWith(dist))
  return own.flatMap((file) =>
    [...program.getSyntacticDiagnostics(file), ...program.getSemanticDiagnostics(file)].map((d) => {
      const { line } = file.getLineAndCharacterOfPosition(d.start ?? 0)
      const text = ts.flattenDiagnosticMessageText(d.messageText, ' ')
      return `${relative(dir, file.fileName)}:${line + 1} TS${d.code} ${text}`
    }),
  )
}

const dirs = (await readdir(packagesDir, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => join(packagesDir, entry.name))

/** name -> manifest, for resolving `workspace:` ranges below. */
const workspace = new Map()
const manifests = []

for (const dir of dirs) {
  const manifestPath = join(dir, 'package.json')
  if (!existsSync(manifestPath)) continue
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  workspace.set(manifest.name, manifest)
  manifests.push({ dir, manifest })
}

for (const { dir, manifest } of manifests) {
  const name = manifest.name ?? relative(root, dir)

  if (manifest.private) {
    notes.push(`${name}: private, not published`)
    continue
  }

  for (const field of REQUIRED_FIELDS) {
    if (manifest[field] === undefined) fail(name, `missing "${field}" in package.json`)
  }

  if (manifest.publishConfig?.access !== 'public' && name.startsWith('@')) {
    fail(name, 'scoped package needs "publishConfig": { "access": "public" } or npm rejects it')
  }

  // Every entry point must actually be on disk. This is the check that catches
  // an unbuilt package, a renamed entry, or an `exports` typo.
  for (const entry of entryPaths(manifest)) {
    // A subpath pattern (`./*`) must match at least one built file, not exist literally.
    if (entry.includes('*')) {
      const [prefix, suffix] = entry.split('*')
      const base = resolve(dir, prefix)
      const matches = existsSync(base)
        ? (await readdir(base, { withFileTypes: true })).filter((e) => existsSync(join(base, e.name + suffix)))
        : []
      if (matches.length === 0) fail(name, `entry pattern "${entry}" matches no built file — run \`pnpm build\``)
      continue
    }
    const target = resolve(dir, entry)
    if (!existsSync(target)) {
      fail(name, `entry point "${entry}" does not exist — run \`pnpm build\``)
    } else if (entry !== './package.json') {
      const { size } = await stat(target)
      if (size === 0) fail(name, `entry point "${entry}" is empty`)
    }
  }

  // A README is what npm renders on the package page; without one the listing
  // is a blank slab. LICENSE keeps the MIT grant attached to the tarball.
  for (const file of ['README.md', 'LICENSE']) {
    if (!existsSync(join(dir, file))) fail(name, `missing ${file}`)
  }

  // `workspace:` ranges are rewritten to real versions by `pnpm publish`, but
  // only if the target is itself published. A dependency on a private package
  // would install as a 404 for everyone downstream.
  for (const field of ['dependencies', 'peerDependencies', 'optionalDependencies']) {
    for (const [dep, range] of Object.entries(manifest[field] ?? {})) {
      if (!String(range).startsWith('workspace:')) continue
      const target = workspace.get(dep)
      if (!target) fail(name, `${field}."${dep}" uses ${range} but no such workspace package`)
      else if (target.private) fail(name, `${field}."${dep}" resolves to a private package`)
    }
  }

  // A stale `dist` publishes fine and behaves like the last release. Compare
  // the two trees rather than trusting that the build was run.
  const [srcTime, distTime] = await Promise.all([
    newestMtime(join(dir, 'src')),
    newestMtime(join(dir, 'dist')),
  ])
  if (distTime === 0) fail(name, 'no dist/ — run `pnpm build`')
  else if (srcTime > distTime) fail(name, 'dist/ is older than src/ — run `pnpm build`')

  for (const error of declarationErrors(dir)) fail(name, `shipped declaration error: ${error}`)

  if (!problems.some((problem) => problem.startsWith(`${name}:`))) {
    notes.push(`${name}@${manifest.version}: ok`)
  }
}

for (const note of notes) console.log(`  ${note}`)

if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s) blocking publish:\n`)
  for (const problem of problems) console.error(`  - ${problem}`)
  console.error('')
  process.exit(1)
}

console.log('\nAll publishable packages look ready.\n')
