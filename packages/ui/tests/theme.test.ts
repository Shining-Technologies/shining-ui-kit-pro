/*
 * `@shining-technologies/ui/theme`: generation, contrast guarantees, safe CSS
 * output and the named presets.
 *
 * Ports the V1 palette assertions (`tests/theming.test.tsx` "generated
 * palettes", `tests/presets.test.tsx` "shipped presets") from `resolveProject`
 * and `BUILT_IN_PALETTES` to `createTheme` and `THEME_PRESETS`.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  SEMANTIC_TOKENS,
  THEME_PRESETS,
  contrastRatio,
  createTheme,
  createThemeCss,
  getThemePreset,
  parseColor,
  tokensToCss,
  type CreateThemeOptions,
  type ThemeTokens,
} from '@shining-technologies/ui/theme'
import { describe, expect, it } from 'vitest'

/** Mid-lightness seeds are the hard case: neither white nor black clears 4.5:1 without moving the fill. */
const SEEDS = [
  '#01493b',
  '#e11d48',
  '#eab308',
  '#06b6d4',
  '#38bdf8',
  '#facc15',
  '#7c3aed',
  '#14b8a6',
  '#f97316',
  '#18181b',
  '#ffffff',
  'oklch(0.7 0.15 150)',
  'hsl(200 90% 50%)',
]

const presetOptions = (preset: (typeof THEME_PRESETS)[number]): CreateThemeOptions => ({
  ...preset.seed,
  neutralTint: preset.neutralTint,
  radius: preset.radius,
})

/** Readable text pairs, as V1 held them: [label, foreground, background]. */
const TEXT_PAIRS: [string, string, string][] = [
  ['body', 'foreground', 'background'],
  ['card', 'card-foreground', 'card'],
  ['popover', 'popover-foreground', 'popover'],
  ['primary', 'primary-foreground', 'primary'],
  ['secondary', 'secondary-foreground', 'secondary'],
  ['muted on card', 'muted-foreground', 'card'],
  ['muted on muted', 'muted-foreground', 'muted'],
  ['accent', 'accent-foreground', 'accent'],
  ['destructive', 'destructive-foreground', 'destructive'],
  ['success', 'success-foreground', 'success'],
  ['warning', 'warning-foreground', 'warning'],
  ['info', 'info-foreground', 'info'],
  ['sidebar', 'sidebar-foreground', 'sidebar'],
  ['sidebar primary', 'sidebar-primary-foreground', 'sidebar-primary'],
  ['sidebar accent', 'sidebar-accent-foreground', 'sidebar-accent'],
]

const FILLED = ['primary', 'destructive', 'success', 'warning', 'info']

/** Below-threshold pairs as readable strings, so a failure names every offender. */
function belowAA(tokens: ThemeTokens, mode: string, pairs: [string, string, string][]) {
  return pairs.flatMap(([label, fg, bg]) => {
    const ratio = contrastRatio(tokens[`--${fg}`]!, tokens[`--${bg}`]!)
    return ratio >= 4.5 ? [] : [`${mode}/${label}: ${ratio.toFixed(2)}`]
  })
}

/** `selector { --a: b; }` blocks of a stylesheet. */
function blocks(css: string): { selector: string; tokens: Record<string, string> }[] {
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
    selector: m[1]!.replace(/^@layer [\w.-]+\s*\{/, '').trim(),
    tokens: Object.fromEntries(
      m[2]!
        .split(';')
        .map((d) => /^\s*(--[\w-]+)\s*:\s*(.+?)\s*$/.exec(d))
        .filter((d): d is RegExpExecArray => d !== null)
        .map((d) => [d[1]!, d[2]!]),
    ),
  }))
}

describe('createTheme', () => {
  it('returns every semantic token, as a colour, for light and dark', () => {
    const theme = createTheme({ primary: '#e11d48' })
    for (const mode of ['light', 'dark'] as const) {
      const missing = SEMANTIC_TOKENS.filter((t) => theme[mode][`--${t}`] === undefined)
      expect(missing, mode).toEqual([])
      for (const token of SEMANTIC_TOKENS) {
        const value = theme[mode][`--${token}`]!
        expect(parseColor(value), `${mode} --${token}: ${value}`).not.toBeNull()
      }
    }
  })

  it('differs between light and dark', () => {
    const theme = createTheme({ primary: '#06b6d4' })
    expect(theme.dark['--background']).not.toBe(theme.light['--background'])
    expect(theme.dark['--foreground']).not.toBe(theme.light['--foreground'])
  })

  it('writes radius and font family only when given, and only for light (they are not mode-specific)', () => {
    expect(createTheme({ primary: '#e11d48' }).light['--radius']).toBeUndefined()
    const theme = createTheme({ primary: '#e11d48', radius: '0.5rem', fontFamily: 'Inter, sans-serif' })
    expect(theme.light['--radius']).toBe('0.5rem')
    expect(theme.light['--font-sans']).toBe('Inter, sans-serif')
    expect(theme.dark['--radius']).toBeUndefined()
  })

  it('is deterministic', () => {
    expect(createTheme({ primary: '#eab308', accent: '#7c3aed' })).toEqual(
      createTheme({ primary: '#eab308', accent: '#7c3aed' }),
    )
  })

  it.each(SEEDS)('keeps every filled colour and its foreground at 4.5:1 in both modes (%s)', (primary) => {
    const theme = createTheme({ primary })
    const pairs = TEXT_PAIRS.filter(([label]) => FILLED.includes(label))
    expect([...belowAA(theme.light, 'light', pairs), ...belowAA(theme.dark, 'dark', pairs)]).toEqual([])
  })

  it.each(SEEDS)('keeps every text/background pair at WCAG AA in both modes (%s)', (primary) => {
    const theme = createTheme({ primary })
    expect([...belowAA(theme.light, 'light', TEXT_PAIRS), ...belowAA(theme.dark, 'dark', TEXT_PAIRS)]).toEqual([])
  })

  it.each(SEEDS)('holds a form-control border to 3:1 against a card in light mode (%s)', (primary) => {
    const { light } = createTheme({ primary })
    expect(contrastRatio(light['--input']!, light['--card']!)).toBeGreaterThanOrEqual(3)
  })

  it('holds user-chosen status colours to the same standard', () => {
    // Every status seed is a light, mid-lightness colour white text fails on.
    const theme = createTheme({
      primary: '#facc15',
      accent: '#22d3ee',
      destructive: '#f87171',
      success: '#4ade80',
      warning: '#fde047',
      info: '#38bdf8',
    })
    expect([...belowAA(theme.light, 'light', TEXT_PAIRS), ...belowAA(theme.dark, 'dark', TEXT_PAIRS)]).toEqual([])
  })

  it.each(['pure', 'subtle', 'tinted'] as const)('keeps AA for neutralTint %s', (neutralTint) => {
    const theme = createTheme({ primary: '#e11d48', neutral: '#78716c', neutralTint })
    expect([...belowAA(theme.light, 'light', TEXT_PAIRS), ...belowAA(theme.dark, 'dark', TEXT_PAIRS)]).toEqual([])
  })

  it('accepts any CSS colour syntax the engine parses', () => {
    for (const primary of ['#e11d48', 'rgb(225 29 72)', 'hsl(347 77% 50%)', 'oklch(0.59 0.22 16)']) {
      expect(() => createTheme({ primary })).not.toThrow()
    }
  })

  it('reproduces the Shining palette from its own seeds', () => {
    const light = createTheme(presetOptions(getThemePreset('shining') as (typeof THEME_PRESETS)[number])).light
    expect(light['--primary']).toBe('#01493b')
    expect(light['--background']).toBe('#fafaf7')
    expect(light['--card']).toBe('#ffffff')
  })

  it('generates the colours theme.css ships as the default (the palette is not written twice)', () => {
    const css = readFileSync(resolve(__dirname, '../src/theme/theme.css'), 'utf8')
    const parsed = blocks(css.replace(/\/\*[\s\S]*?\*\//g, ''))
    // The palette is in the last rules; the first (@layer theme) holds fonts and spacing.
    const root = parsed.filter((b) => b.selector === ':where(:root)').at(-1)!.tokens
    const dark = parsed.filter((b) => b.selector === ':where(.dark)').at(-1)!.tokens
    const theme = createTheme(presetOptions(THEME_PRESETS.find((p) => p.id === 'shining')!))
    const pick = (tokens: Record<string, string>) =>
      Object.fromEntries(SEMANTIC_TOKENS.map((t) => [`--${t}`, tokens[`--${t}`]?.toLowerCase()]))
    expect(pick(root)).toEqual(pick(theme.light))
    expect(pick(dark)).toEqual(pick(theme.dark))
    expect(root['--radius']).toBe(theme.light['--radius'])
  })
})

describe('createThemeCss', () => {
  it('produces a :root block and a .dark block with every token', () => {
    const css = createThemeCss({ primary: '#e11d48' })
    const parsed = blocks(css)
    expect(parsed.map((b) => b.selector)).toEqual([':root', '.dark'])
    for (const block of parsed) {
      expect(SEMANTIC_TOKENS.filter((t) => block.tokens[`--${t}`] === undefined)).toEqual([])
    }
    expect(css).not.toContain('@layer')
  })

  it('writes exactly what createTheme returns', () => {
    const theme = createTheme({ primary: '#06b6d4', radius: '0.25rem' })
    const [light, dark] = blocks(createThemeCss({ primary: '#06b6d4', radius: '0.25rem' }))
    expect(light!.tokens).toEqual(theme.light)
    expect(dark!.tokens).toEqual(theme.dark)
    expect(createThemeCss(theme)).toBe(createThemeCss({ primary: '#06b6d4', radius: '0.25rem' }))
  })

  it('honours selector, darkSelector and layer', () => {
    const css = createThemeCss(
      { primary: '#eab308' },
      { selector: "[data-theme='acme']", darkSelector: ".dark [data-theme='acme']", layer: 'tenant' },
    )
    expect(css.startsWith('@layer tenant {\n')).toBe(true)
    expect(css.trimEnd().endsWith('}')).toBe(true)
    expect(blocks(css).map((b) => b.selector)).toEqual(["[data-theme='acme']", ".dark [data-theme='acme']"])
    expect(css).not.toMatch(/(^|\n):root \{/)
  })

  it('builds every preset with the selectors generate-presets.mjs uses', () => {
    for (const preset of THEME_PRESETS) {
      const css = createThemeCss(presetOptions(preset), {
        selector: `:where([data-theme='${preset.id}'])`,
        darkSelector: `:where(.dark[data-theme='${preset.id}'], .dark [data-theme='${preset.id}'])`,
      })
      expect(css).toContain(`:where([data-theme='${preset.id}']) {`)
      expect(css).toContain(`--radius: ${preset.radius};`)
    }
  })

  describe('hostile input', () => {
    const INJECTIONS = [
      '</style><script>alert(1)</script>',
      'red;}</style><script>alert(1)</script>',
      '#fff}body{background:url(//evil)}',
      '1rem;}</style><script>',
      'red/**/',
      'expression(alert(1))',
      '\\3c/style\\3e',
      '</STYLE>',
      '<!--',
    ]

    it.each(['primary', 'accent', 'neutral', 'surface', 'destructive', 'success', 'warning', 'info'] as const)(
      'rejects a %s that is not a colour',
      (key) => {
        expect(() => createThemeCss({ primary: '#e11d48', [key]: 'banana' })).toThrow(TypeError)
        for (const value of INJECTIONS) {
          expect(() => createThemeCss({ primary: '#e11d48', [key]: value }), value).toThrow()
        }
      },
    )

    it('rejects a radius or font family that could end the rule', () => {
      expect(() => createThemeCss({ primary: '#e11d48', radius: '1rem;}</style><script>' })).toThrow(TypeError)
      expect(() => createThemeCss({ primary: '#e11d48', radius: '1rem /* x' })).toThrow(TypeError)
      expect(() => createThemeCss({ primary: '#e11d48', fontFamily: 'Inter</style><script>' })).toThrow(TypeError)
      expect(() => createThemeCss({ primary: '#e11d48', fontFamily: 'Inter; color: red' })).toThrow(TypeError)
    })

    it('rejects an unsafe selector, dark selector or layer name', () => {
      for (const selector of [':root{}', '</style><script>', ':root;', 'a > b']) {
        expect(() => createThemeCss({ primary: '#e11d48' }, { selector }), selector).toThrow(TypeError)
        expect(() => createThemeCss({ primary: '#e11d48' }, { darkSelector: selector }), selector).toThrow(TypeError)
      }
      for (const layer of ['base{}</style>', 'a b', '1st', 'x;', '</style>']) {
        expect(() => createThemeCss({ primary: '#e11d48' }, { layer }), layer).toThrow(TypeError)
      }
    })

    it('rejects a hostile value or property name in a ready-made definition', () => {
      const good = createTheme({ primary: '#e11d48' })
      expect(() =>
        createThemeCss({ light: { ...good.light, '--primary': '</style><script>alert(1)</script>' }, dark: good.dark }),
      ).toThrow(TypeError)
      expect(() =>
        createThemeCss({ light: good.light, dark: { 'color:red;}</style><script>': 'red' } }),
      ).toThrow(TypeError)
      expect(() => tokensToCss(':root', { '--x': 'a{b' })).toThrow(TypeError)
      expect(() => tokensToCss(':root', { primary: 'red' })).toThrow(TypeError)
    })

    it('never outputs </style or <script, whatever goes in where', () => {
      const values = [...INJECTIONS, '#e11d48', 'rgb(1 2 3)', '</sty', 'le>', '<script']
      const outputs: string[] = []
      const attempt = (fn: () => string) => {
        try {
          outputs.push(fn())
        } catch {
          // Rejected: nothing reaches the page.
        }
      }
      for (const value of values) {
        attempt(() => createThemeCss({ primary: value }))
        attempt(() => createThemeCss({ primary: '#e11d48', accent: value, surface: value }))
        attempt(() => createThemeCss({ primary: '#e11d48', radius: value }))
        attempt(() => createThemeCss({ primary: '#e11d48', fontFamily: value }))
        attempt(() => createThemeCss({ primary: '#e11d48' }, { selector: value }))
        attempt(() => createThemeCss({ primary: '#e11d48' }, { darkSelector: value }))
        attempt(() => createThemeCss({ primary: '#e11d48' }, { layer: value }))
        attempt(() => createThemeCss({ light: { '--primary': value }, dark: { [`--${value}`]: 'red' } }))
      }
      expect(outputs.length).toBeGreaterThan(0)
      for (const css of outputs) {
        expect(css.toLowerCase()).not.toContain('</style')
        expect(css.toLowerCase()).not.toContain('<script')
      }
    })
  })
})

describe('THEME_PRESETS', () => {
  it('has unique ids and unique brand colours', () => {
    const ids = THEME_PRESETS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
    const primaries = THEME_PRESETS.map((p) => p.seed.primary.toLowerCase())
    expect(new Set(primaries).size).toBe(primaries.length)
  })

  it('ships Darwind and Unn with their own colour and shape', () => {
    const darwind = getThemePreset('darwind')!
    const unn = getThemePreset('unn')!
    expect(darwind.seed.primary).not.toBe(unn.seed.primary)
    expect(darwind.seed.accent).not.toBe(unn.seed.accent)
    expect(darwind.radius).not.toBe(unn.radius)
    expect(getThemePreset('darwnid')).toBeUndefined()
  })

  it('uses ids that are safe inside the generated [data-theme] selectors', () => {
    for (const preset of THEME_PRESETS) expect(preset.id).toMatch(/^[a-z][a-z0-9-]*$/)
  })

  it.each(THEME_PRESETS.map((p) => [p.id, p] as const))('%s generates without throwing', (_id, preset) => {
    expect(() => createTheme(presetOptions(preset))).not.toThrow()
    expect(() => createThemeCss(presetOptions(preset))).not.toThrow()
  })

  it.each(THEME_PRESETS.map((p) => [p.id, p] as const))(
    '%s keeps every text/background pair at WCAG AA in both modes',
    (_id, preset) => {
      const theme = createTheme(presetOptions(preset))
      expect([...belowAA(theme.light, 'light', TEXT_PAIRS), ...belowAA(theme.dark, 'dark', TEXT_PAIRS)]).toEqual([])
      expect(contrastRatio(theme.light['--input']!, theme.light['--card']!)).toBeGreaterThanOrEqual(3)
    },
  )

  it('gives every preset five distinguishable chart colours', () => {
    for (const preset of THEME_PRESETS) {
      const { light } = createTheme(presetOptions(preset))
      const charts = [1, 2, 3, 4, 5].map((n) => light[`--chart-${n}`]!)
      expect(new Set(charts).size, preset.id).toBe(5)
      for (let i = 1; i < charts.length; i++) {
        expect(contrastRatio(charts[i - 1]!, charts[i]!), `${preset.id} chart ${i}/${i + 1}`).toBeGreaterThan(1.2)
      }
    }
  })

  it('never mutates the shipped preset', () => {
    const unn = getThemePreset('unn')!
    const before = JSON.stringify(unn)
    createTheme({ ...unn.seed, primary: '#000000', radius: '0px' })
    createThemeCss({ ...unn.seed, neutralTint: unn.neutralTint, radius: unn.radius })
    expect(JSON.stringify(unn)).toBe(before)
  })
})
