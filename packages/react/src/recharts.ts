/**
 * `@shining-technologies/ui-kit-react/recharts` — the Recharts-powered chart set.
 *
 * A separate entry point so `recharts` is only pulled into bundles that ask
 * for it: importing the root package still costs nothing beyond the
 * components used. See ARCHITECTURE.md.
 */
export * from './recharts/index'
