/*
 * Every released version has a release-notes page and an index row.
 *
 * The page is written in the release commit (docs/releases/README.md, "Writing
 * one"), and it becomes the GitHub Release body. Checking it here makes a
 * version bump without its notes fail in `vitest` rather than at release.
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// Not `new URL(…, import.meta.url)`: under happy-dom `URL` is the DOM's, which refuses file: URLs.
const PKG = resolve(__dirname, '..')
const RELEASES = resolve(PKG, '../../docs/releases')

const { version } = JSON.parse(readFileSync(resolve(PKG, 'package.json'), 'utf8')) as {
  version: string
}
const page = `ui-v${version}.md`

describe(`release notes for ${version}`, () => {
  it('has a page', () => {
    expect(existsSync(resolve(RELEASES, page)), `docs/releases/${page} is missing`).toBe(true)
  })

  it('has a row in the index', () => {
    const index = readFileSync(resolve(RELEASES, 'README.md'), 'utf8')
    expect(index).toContain(`| [ui-v${version}](${page}) |`)
  })
})
