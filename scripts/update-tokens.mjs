/**
 * Regenerate `packages/react/src/styles/tokens.generated.css`.
 *
 * A wrapper rather than an inline `UPDATE_TOKENS=1 vitest …` in the package
 * script, because that prefix syntax is not portable to the Windows shells
 * this repo is developed on.
 */
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))

// Resolve vitest's own entry rather than shelling out to `npx`, which needs a
// different binary name per platform and a shell that can find it.
const require = createRequire(import.meta.url)
const vitest = require.resolve('vitest/vitest.mjs')

const child = spawn(process.execPath, [vitest, 'run', 'tests/tokens.test.ts'], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, UPDATE_TOKENS: '1' },
})

child.on('exit', (code) => process.exit(code ?? 1))
