/**
 * The chart suites again, against Recharts 3.
 *
 * The peer range is `^2.15.0 || ^3.0.0`. `recharts` stays at v2 for the main
 * run and v3 is installed beside it as `recharts-v3`, so both majors are tested.
 * This config reuses the main one and swaps the module only; `test.include` is
 * replaced rather than merged, so only the chart suites run.
 */
import { defineConfig } from 'vitest/config'
import base from './vitest.config'

const baseAlias = Array.isArray(base.resolve?.alias) ? base.resolve.alias : []

export default defineConfig({
  ...base,
  resolve: {
    ...base.resolve,
    alias: [
      // `recharts` and its subpaths; `recharts-v3` itself must not be rewritten again.
      { find: /^recharts(\/.*)?$/, replacement: 'recharts-v3$1' },
      ...baseAlias,
    ],
  },
  test: {
    ...base.test,
    include: ['tests/audit-charts.test.tsx', 'tests/charts-*.test.tsx'],
  },
})
