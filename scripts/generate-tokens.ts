/**
 * Emit the stylesheet's default token block from the default project.
 *
 * The kit has to look finished with no provider mounted — someone importing a
 * single Button should not have to set up theming first. That means the same
 * palette exists twice: once generated at runtime, once frozen into CSS. Rather
 * than maintain the copy by hand, it is generated from the same function, and
 * `tests/tokens.test.ts` fails if the committed file has drifted.
 *
 * Regenerate with `pnpm tokens`.
 */
import {
  CSS_VAR_MAP,
  defaultPalette,
  resolveProject,
  themeToCssVars,
} from '../packages/core/src/index'

const BANNER = `/*
 * Design tokens — the entire visual surface of the kit.
 *
 * Every component resolves every colour, radius, size and shadow to one of
 * these custom properties. Nothing below this file hardcodes a value, which is
 * what lets <UIKitProvider> restyle an application by writing variables (§24).
 *
 * The names mirror the shadcn/ui vocabulary so a design authored against that
 * vocabulary maps across one-to-one.
 *
 * GENERATED FILE — edit scripts/generate-tokens.ts and run \`pnpm tokens\`.
 * The defaults below are the "${defaultPalette.name}" project; a provider
 * overwrites them at runtime.
 */`

/** Group the variables the way a human reads them, not the way the map lists them. */
const SECTIONS: Array<[string, string[]]> = [
  [
    'surfaces',
    [
      'background',
      'foreground',
      'card',
      'card-foreground',
      'popover',
      'popover-foreground',
      'popover-border',
    ],
  ],
  [
    'intent',
    [
      'primary',
      'primary-foreground',
      'secondary',
      'secondary-foreground',
      'muted',
      'muted-foreground',
      'accent',
      'accent-foreground',
    ],
  ],
  [
    'status',
    [
      'destructive',
      'destructive-foreground',
      'success',
      'success-foreground',
      'warning',
      'warning-foreground',
      'info',
      'info-foreground',
    ],
  ],
  ['lines', ['border', 'input', 'ring']],
  ['charts', ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5']],
  [
    'sidebar',
    [
      'sidebar',
      'sidebar-foreground',
      'sidebar-primary',
      'sidebar-primary-foreground',
      'sidebar-accent',
      'sidebar-accent-foreground',
      'sidebar-border',
      'sidebar-ring',
    ],
  ],
  ['table header', ['header-background', 'header-foreground', 'header-border']],
  [
    'table rows',
    [
      'row-background',
      'row-foreground',
      'row-hover',
      'row-selected',
      'row-selected-hover',
      'row-striped',
      'row-border',
    ],
  ],
  [
    'geometry',
    ['radius', 'radius-sm', 'radius-control', 'radius-surface', 'radius-lg', 'border-width'],
  ],
  [
    'typography',
    [
      'font-family',
      'font-family-mono',
      'font-size',
      'font-weight',
      'line-height',
      'title-font-weight',
      'header-font-size',
      'header-font-weight',
      'header-letter-spacing',
    ],
  ],
  [
    'rhythm',
    [
      'cell-padding-x',
      'cell-padding-y',
      'header-padding-x',
      'header-padding-y',
      'gap',
      'stack',
      'surface-padding',
    ],
  ],
  [
    'sizing',
    [
      'control-height',
      'control-height-sm',
      'control-height-lg',
      'header-height',
      'row-height',
      'min-column-width',
    ],
  ],
  [
    'elevation',
    [
      'shadow-surface',
      'shadow-overlay',
      'shadow-modal',
      'shadow-pinned-left',
      'shadow-pinned-right',
    ],
  ],
]

/** Values the project system does not generate because they never vary by mode. */
const STATIC_TOKENS: Record<string, string> = {
  '--sui-font-weight': '400',
  '--sui-line-height': '1.45',
  '--sui-header-font-size': '0.75rem',
  '--sui-header-font-weight': '500',
  '--sui-header-letter-spacing': '0.02em',
  '--sui-cell-padding-x': '0.875rem',
  '--sui-cell-padding-y': '0.625rem',
  '--sui-header-padding-x': '0.875rem',
  '--sui-header-padding-y': '0.5rem',
  '--sui-gap': '0.5rem',
  '--sui-stack': '1rem',
  '--sui-surface-padding': '1rem',
  '--sui-control-height': '2.25rem',
  '--sui-control-height-sm': '2rem',
  '--sui-control-height-lg': '2.5rem',
  '--sui-header-height': '2.75rem',
  '--sui-row-height': '3rem',
  '--sui-min-column-width': '3.5rem',
}

function block(vars: Record<string, string>, indent: string): string {
  const lines: string[] = []
  const seen = new Set<string>()

  for (const [title, names] of SECTIONS) {
    const entries = names
      .map((n) => `--sui-${n}`)
      .filter((name) => vars[name] !== undefined)
      .map((name) => {
        seen.add(name)
        return `${indent}${name}: ${vars[name]};`
      })
    if (!entries.length) continue
    lines.push(`${indent}/* ${title} */`, ...entries, '')
  }

  // Anything a future token adds still lands in the file rather than silently
  // going missing.
  const rest = Object.keys(vars)
    .filter((name) => !seen.has(name))
    .sort()
  if (rest.length) {
    lines.push(
      `${indent}/* other */`,
      ...rest.map((name) => `${indent}${name}: ${vars[name]};`),
      '',
    )
  }

  return lines.join('\n').trimEnd()
}

export function generateTokensCss(): string {
  const { light, dark } = resolveProject(defaultPalette)
  const lightVars = { ...themeToCssVars(light), ...STATIC_TOKENS }
  const darkVars = themeToCssVars(dark)

  // Only the tokens that actually differ belong in the dark rules; repeating
  // the rest would make a mode swap look like a full retheme in devtools.
  const darkDelta = Object.fromEntries(
    Object.entries(darkVars).filter(([name, value]) => lightVars[name] !== value),
  )

  return `${BANNER}

:root {
${block(lightVars, '  ')}
}

/*
 * Dark mode follows the host application: a \`.dark\` / \`[data-sui-mode="dark"]\`
 * ancestor, or the OS preference when the app has not made a choice. The kit
 * never decides on its own (§33).
 */
.dark,
[data-sui-mode='dark'] {
${block(darkDelta, '  ')}
}

@media (prefers-color-scheme: dark) {
  :root:not(.light):not([data-sui-mode='light']) {
${block(darkDelta, '    ')}
  }
}
`
}

/** Sanity check for the generator itself, asserted by the token test. */
export const GENERATED_TOKEN_COUNT = Object.keys(CSS_VAR_MAP.colors).length
