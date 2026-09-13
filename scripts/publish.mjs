/**
 * Publish every package whose version is not on npm yet, with the right dist-tag.
 *
 *   node scripts/publish.mjs
 *
 * `changeset publish` only knows two tags: `latest`, or the pre-mode tag. A
 * package whose version was set to a prerelease by hand (`2.0.0-rc.0`) outside
 * pre mode would therefore land on `latest`, and `npm install
 * @shining-technologies/ui` would start resolving to a release candidate.
 *
 * So prereleases are published here first, under `next`, and `changeset
 * publish` runs afterwards: it sees those versions on the registry, skips them,
 * and publishes the stable packages as usual. The `New tag:` lines match what
 * `changeset publish` prints, so changesets/action pushes the git tags for both.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PRERELEASE_TAG = 'next'
const shell = process.platform === 'win32'

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', shell, ...options })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

/** True when `name@version` already exists on the registry. */
function isPublished(name, version) {
  const result = spawnSync('npm', ['view', `${name}@${version}`, 'version'], {
    cwd: root,
    encoding: 'utf8',
    shell,
  })
  if (result.status !== 0) {
    if (/E404/.test(result.stderr)) return false
    process.stderr.write(result.stderr)
    process.exit(result.status ?? 1)
  }
  return result.stdout.trim() === version
}

const packagesDir = join(root, 'packages')
const prereleases = readdirSync(packagesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => join(packagesDir, entry.name, 'package.json'))
  .filter((path) => existsSync(path))
  .map((path) => ({ dir: dirname(path), manifest: JSON.parse(readFileSync(path, 'utf8')) }))
  .filter(({ manifest }) => !manifest.private && manifest.version.includes('-'))

for (const { dir, manifest } of prereleases) {
  const { name, version } = manifest
  if (isPublished(name, version)) {
    console.log(`${name}@${version} is already published`)
    continue
  }
  console.log(`Publishing ${name}@${version} under the "${PRERELEASE_TAG}" tag`)
  run('pnpm', ['publish', '--tag', PRERELEASE_TAG, '--no-git-checks'], { cwd: dir })
  run('git', ['tag', `${name}@${version}`])
  console.log(`New tag: ${name}@${version}`)
}

run('pnpm', ['exec', 'changeset', 'publish'])
