/**
 * Verify every relative markdown link in the repository points at a file that
 * exists — and, when the link carries a `#fragment`, at a heading that exists.
 *
 *   node scripts/check-docs-links.mjs
 *
 * Documentation rots quietly: a page is renamed, the six pages that linked to
 * it keep their old href, and nobody notices until a reader does. Checking it
 * costs a second, so it runs in CI alongside the other gates.
 *
 * External links (http, mailto) are left alone — this makes no network calls.
 */
import { readdir, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SKIP = new Set(['node_modules', '.git', 'dist', 'coverage', '.changeset'])

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue
    const path = join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(path)
    else if (entry.name.endsWith('.md')) yield path
  }
}

/** GitHub's slug: lowercase, punctuation dropped, spaces to hyphens. */
function slug(heading) {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[^\w\- ]+/g, '')
    .replace(/ +/g, '-')
}

const headings = new Map() // file -> Set<slug>

async function slugsOf(file) {
  if (headings.has(file)) return headings.get(file)
  const set = new Set()
  if (existsSync(file)) {
    const source = await readFile(file, 'utf8')
    // Ignore fenced code blocks, where `#` is a comment, not a heading.
    const body = source.replace(/^```[\s\S]*?^```/gm, '')
    for (const [, text] of body.matchAll(/^#{1,6}\s+(.+)$/gm)) set.add(slug(text))
  }
  headings.set(file, set)
  return set
}

const LINK = /\[[^\]]*\]\(([^)\s]+)\)/g
const problems = []
let checked = 0

for await (const file of walk(root)) {
  const source = await readFile(file, 'utf8')
  const body = source.replace(/^```[\s\S]*?^```/gm, '')

  for (const [, href] of body.matchAll(LINK)) {
    if (/^(https?:|mailto:|#)/.test(href)) continue
    const [path, fragment] = href.split('#')
    if (!path) continue
    const target = resolve(dirname(file), path)
    checked++

    if (!existsSync(target)) {
      problems.push(`${relative(root, file)} -> ${href} (no such file)`)
      continue
    }
    if (fragment && target.endsWith('.md')) {
      const set = await slugsOf(target)
      if (!set.has(fragment.toLowerCase())) {
        problems.push(`${relative(root, file)} -> ${href} (no such heading)`)
      }
    }
  }
}

if (problems.length > 0) {
  console.error(`\n${problems.length} broken link(s) of ${checked} checked:\n`)
  for (const problem of problems) console.error(`  - ${problem}`)
  console.error('')
  process.exit(1)
}

console.log(`${checked} relative links checked, all resolve.`)
