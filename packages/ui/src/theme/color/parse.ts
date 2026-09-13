import type { Oklch, Rgb } from './oklch'
import { gamutFit, oklchToRgb, rgbToOklch } from './oklch'

/**
 * Parse the colour syntaxes a designer actually types.
 *
 * Deliberately narrow: hex, `rgb()`/`rgba()`, `hsl()`/`hsla()` and `oklch()`.
 * Named CSS colours and `color(display-p3 …)` are not handled — a project
 * palette is authored, not scraped, and silently mis-parsing one would poison
 * every derived token.
 *
 * Parsing is strict and covers the whole string, following CSS Color 4: a
 * value with anything before, after or inside it that is not part of the
 * colour (`rgb(1 2 3) url(…)`, `#fff;`) is rejected, as are unitless
 * saturation/lightness in the legacy comma syntax. Out-of-range components
 * are clamped where CSS clamps them. Anything unrecognised returns `null` so
 * the caller can fall back rather than render a black UI.
 */
export function parseColor(input: string): Oklch | null {
  if (typeof input !== 'string') return null
  const value = input.trim().toLowerCase()
  if (HEX.test(value)) return parseHex(value.slice(1))

  const fn = FUNCTION.exec(value)
  if (!fn) return null
  const args = splitArguments(fn[2]!)
  if (!args) return null
  if (fn[1] === 'oklch') return parseOklch(args)
  if (fn[1] === 'hsl' || fn[1] === 'hsla') return parseHsl(args)
  return parseRgb(args)
}

const HEX = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/
/** A supported function whose arguments contain no nested parentheses, and nothing after it. */
const FUNCTION = /^(rgba?|hsla?|oklch)\(([^()]*)\)$/

/** CSS `<number>`: `1`, `-0.5`, `.5`, `1e3`. Not `1.`, not `0x10`. */
const NUMBER = String.raw`[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?`
const NUMBER_TOKEN = new RegExp(`^${NUMBER}$`)
const PERCENT_TOKEN = new RegExp(`^(${NUMBER})%$`)
const HUE_TOKEN = new RegExp(`^(${NUMBER})(deg|grad|rad|turn)?$`)

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n)

function parseHex(hex: string): Oklch {
  const expand = (s: string) => parseInt(s.length === 1 ? s + s : s, 16) / 255
  if (hex.length <= 4) {
    return rgbToOklch({
      r: expand(hex[0]!),
      g: expand(hex[1]!),
      b: expand(hex[2]!),
      alpha: hex.length === 4 ? expand(hex[3]!) : 1,
    })
  }
  return rgbToOklch({
    r: expand(hex.slice(0, 2)),
    g: expand(hex.slice(2, 4)),
    b: expand(hex.slice(4, 6)),
    alpha: hex.length === 8 ? expand(hex.slice(6, 8)) : 1,
  })
}

interface Arguments {
  /** The three colour components. */
  values: [string, string, string]
  /** The alpha component, when present. */
  alpha: string | undefined
  /** Legacy comma-separated syntax: no `none`, and stricter component types. */
  legacy: boolean
}

/** `a b c`, `a b c / d`, or the legacy `a, b, c` / `a, b, c, d`. Anything else is `null`. */
function splitArguments(body: string): Arguments | null {
  const text = body.trim()
  if (text.includes(',')) {
    const parts = text.split(',').map((part) => part.trim())
    if (parts.length < 3 || parts.length > 4) return null
    if (parts.some((part) => part === '' || /\s/.test(part))) return null
    return { values: [parts[0]!, parts[1]!, parts[2]!], alpha: parts[3], legacy: true }
  }
  const halves = text.split('/')
  if (halves.length > 2) return null
  const values = halves[0]!.trim().split(/\s+/).filter(Boolean)
  if (values.length !== 3) return null
  let alpha: string | undefined
  if (halves.length === 2) {
    alpha = halves[1]!.trim()
    if (alpha === '' || /\s/.test(alpha)) return null
  }
  return { values: [values[0]!, values[1]!, values[2]!], alpha, legacy: false }
}

function finite(n: number): number | null {
  return Number.isFinite(n) ? n : null
}

function numberToken(token: string): number | null {
  return NUMBER_TOKEN.test(token) ? finite(Number(token)) : null
}

/** The number in front of a `%`, e.g. `50` for `50%`. */
function percentToken(token: string): number | null {
  const match = PERCENT_TOKEN.exec(token)
  return match ? finite(Number(match[1])) : null
}

/** A `<hue>` in degrees, normalised to [0, 360). */
function hueToken(token: string): number | null {
  const match = HUE_TOKEN.exec(token)
  if (!match) return null
  const n = finite(Number(match[1]))
  if (n === null) return null
  const unit = match[2]
  const degrees = unit === 'grad' ? n * 0.9 : unit === 'rad' ? (n * 180) / Math.PI : unit === 'turn' ? n * 360 : n
  return finite(((degrees % 360) + 360) % 360)
}

/** `<alpha-value>`: a number or percentage, clamped to [0, 1]. `none` is 0 in the modern syntax. */
function alphaToken(token: string | undefined, legacy: boolean): number | null {
  if (token === undefined) return 1
  if (!legacy && token === 'none') return 0
  const percent = percentToken(token)
  if (percent !== null) return clamp01(percent / 100)
  const n = numberToken(token)
  return n === null ? null : clamp01(n)
}

function parseRgb({ values, alpha, legacy }: Arguments): Oklch | null {
  const channels: number[] = []
  let percents = 0
  for (const token of values) {
    if (!legacy && token === 'none') {
      channels.push(0)
      continue
    }
    const percent = percentToken(token)
    if (percent !== null) {
      percents++
      channels.push(clamp01(percent / 100))
      continue
    }
    const n = numberToken(token)
    if (n === null) return null
    channels.push(clamp01(n / 255))
  }
  // The legacy syntax takes three numbers or three percentages, never a mix.
  if (legacy && percents !== 0 && percents !== 3) return null
  const a = alphaToken(alpha, legacy)
  if (a === null) return null
  return rgbToOklch({ r: channels[0]!, g: channels[1]!, b: channels[2]!, alpha: a })
}

function parseHsl({ values, alpha, legacy }: Arguments): Oklch | null {
  const hue = !legacy && values[0] === 'none' ? 0 : hueToken(values[0])
  if (hue === null) return null

  // Saturation and lightness: percentages; the modern syntax also takes a bare number (`50` = 50%).
  const component = (token: string): number | null => {
    if (!legacy && token === 'none') return 0
    const percent = percentToken(token)
    if (percent !== null) return percent
    return legacy ? null : numberToken(token)
  }
  const s = component(values[1])
  const l = component(values[2])
  if (s === null || l === null) return null
  const a = alphaToken(alpha, legacy)
  if (a === null) return null

  const sat = clamp01(s / 100)
  const light = clamp01(l / 100)
  const k = (n: number) => (n + hue / 30) % 12
  const chroma = sat * Math.min(light, 1 - light)
  const f = (n: number) => light - chroma * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return rgbToOklch({ r: f(0), g: f(8), b: f(4), alpha: a })
}

function parseOklch({ values, alpha, legacy }: Arguments): Oklch | null {
  // `oklch()` has no legacy comma syntax.
  if (legacy) return null
  const read = (token: string, percentScale: number): number | null => {
    if (token === 'none') return 0
    const percent = percentToken(token)
    if (percent !== null) return (percent / 100) * percentScale
    return numberToken(token)
  }
  const l = read(values[0], 1)
  const c = read(values[1], 0.4)
  const h = values[2] === 'none' ? 0 : hueToken(values[2])
  if (l === null || c === null || h === null) return null
  const a = alphaToken(alpha, false)
  if (a === null) return null
  return { l: clamp01(l), c: Math.max(0, c), h, alpha: a }
}

const hex2 = (n: number) =>
  Math.round(n * 255)
    .toString(16)
    .padStart(2, '0')

/**
 * Render as hex.
 *
 * Hex rather than `oklch()` on purpose: a project palette is serialised to
 * localStorage, pasted into config files and shown in a colour input, all of
 * which understand hex everywhere. Out-of-gamut colours are fitted first so
 * the hue survives the round trip.
 */
export function formatHex(color: Oklch): string {
  const rgb = oklchToRgb(gamutFit(color))
  const base = `#${hex2(rgb.r)}${hex2(rgb.g)}${hex2(rgb.b)}`
  return rgb.alpha >= 1 ? base : `${base}${hex2(rgb.alpha)}`
}

/** Render as `oklch()`, for when the extra gamut headroom is worth keeping. */
export function formatOklch(color: Oklch): string {
  const l = round(color.l, 4)
  const c = round(color.c, 4)
  const h = round(color.h, 2)
  return color.alpha >= 1
    ? `oklch(${l} ${c} ${h})`
    : `oklch(${l} ${c} ${h} / ${round(color.alpha, 3)})`
}

export function toRgb(color: Oklch): Rgb {
  return oklchToRgb(gamutFit(color))
}

function round(n: number, places: number): number {
  const f = 10 ** places
  return Math.round(n * f) / f
}
