import type { Oklch, Rgb } from './oklch'
import { gamutFit, oklchToRgb, rgbToOklch } from './oklch'

/**
 * Parse the colour syntaxes a designer actually types.
 *
 * Deliberately narrow: hex, `rgb()`, `hsl()` and `oklch()`. Named CSS colours
 * and `color(display-p3 …)` are not handled — a project palette is authored,
 * not scraped, and silently mis-parsing one would poison every derived token.
 * Anything unrecognised returns `null` so the caller can fall back rather than
 * render a black UI.
 */
export function parseColor(input: string): Oklch | null {
  const value = input.trim().toLowerCase()
  if (!value) return null

  if (value.startsWith('#')) return parseHex(value)
  if (value.startsWith('oklch(')) return parseOklchFn(value)
  if (value.startsWith('rgb')) return parseRgbFn(value)
  if (value.startsWith('hsl')) return parseHslFn(value)
  return null
}

function parseHex(value: string): Oklch | null {
  const hex = value.slice(1)
  const expand = (s: string) => parseInt(s.length === 1 ? s + s : s, 16) / 255

  if (hex.length === 3 || hex.length === 4) {
    if (!/^[0-9a-f]+$/.test(hex)) return null
    return rgbToOklch({
      r: expand(hex[0]!),
      g: expand(hex[1]!),
      b: expand(hex[2]!),
      alpha: hex.length === 4 ? expand(hex[3]!) : 1,
    })
  }
  if (hex.length === 6 || hex.length === 8) {
    if (!/^[0-9a-f]+$/.test(hex)) return null
    return rgbToOklch({
      r: expand(hex.slice(0, 2)),
      g: expand(hex.slice(2, 4)),
      b: expand(hex.slice(4, 6)),
      alpha: hex.length === 8 ? expand(hex.slice(6, 8)) : 1,
    })
  }
  return null
}

/** Pull the numeric arguments out of `fn(a b c / d)` or `fn(a, b, c, d)`. */
function args(value: string): string[] {
  const open = value.indexOf('(')
  const close = value.lastIndexOf(')')
  if (open < 0 || close < 0) return []
  return value
    .slice(open + 1, close)
    .replace(/\//g, ' ')
    .split(/[\s,]+/)
    .filter(Boolean)
}

/** A number that may carry a `%`; `scale` is what 100% means. */
function num(token: string | undefined, scale = 1): number {
  if (!token) return NaN
  if (token.endsWith('%')) return (parseFloat(token) / 100) * scale
  return parseFloat(token)
}

function parseOklchFn(value: string): Oklch | null {
  const [l, c, h, a] = args(value)
  const lightness = num(l, 1)
  const chroma = num(c, 0.4)
  const hue = h === undefined || h === 'none' ? 0 : parseFloat(h)
  if (!isFinite(lightness) || !isFinite(chroma) || !isFinite(hue)) return null
  const alpha = a === undefined ? 1 : num(a, 1)
  return {
    l: lightness,
    c: chroma,
    h: ((hue % 360) + 360) % 360,
    alpha: isFinite(alpha) ? alpha : 1,
  }
}

function parseRgbFn(value: string): Oklch | null {
  const [r, g, b, a] = args(value)
  const red = num(r, 255)
  const green = num(g, 255)
  const blue = num(b, 255)
  if (!isFinite(red) || !isFinite(green) || !isFinite(blue)) return null
  const alpha = a === undefined ? 1 : num(a, 1)
  return rgbToOklch({
    r: red / 255,
    g: green / 255,
    b: blue / 255,
    alpha: isFinite(alpha) ? alpha : 1,
  })
}

function parseHslFn(value: string): Oklch | null {
  const [h, s, l, a] = args(value)
  const hue = ((parseFloat(h ?? '') % 360) + 360) % 360
  const sat = num(s, 1)
  const light = num(l, 1)
  if (!isFinite(hue) || !isFinite(sat) || !isFinite(light)) return null
  const alpha = a === undefined ? 1 : num(a, 1)

  const k = (n: number) => (n + hue / 30) % 12
  const chroma = sat * Math.min(light, 1 - light)
  const f = (n: number) => light - chroma * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return rgbToOklch({ r: f(0), g: f(8), b: f(4), alpha: isFinite(alpha) ? alpha : 1 })
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
