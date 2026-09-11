/**
 * The chart suites again, against Recharts 3.
 *
 * `recharts` stays at v2 in the workspace and v3 is installed beside it under
 * the `recharts-v3` alias, so both majors the peer range promises are tested
 * without anyone's install changing under them. This config reuses the main
 * one and swaps the module only; `test.include` is replaced rather than
 * merged, because `mergeConfig` concatenates arrays and would run everything.
 */
import { defineConfig } from 'vitest/config'
import base from './vitest.config'

const baseAlias = base.resolve?.alias ?? {}

export default defineConfig({
  ...base,
  resolve: {
    ...base.resolve,
    alias: [
      // Exact match only: `recharts-v3` itself must not be rewritten again.
      { find: /^recharts$/, replacement: 'recharts-v3' },
      ...Object.entries(baseAlias).map(([find, replacement]) => ({ find, replacement })),
    ],
  },
  test: {
    ...base.test,
    include: ['tests/audit-charts.test.tsx', 'tests/charts-*.test.tsx'],
  },
})
