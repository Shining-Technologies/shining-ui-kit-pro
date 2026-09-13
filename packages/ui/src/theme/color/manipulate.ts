import type { Oklch } from './oklch'
import { relativeLuminance } from './oklch'
import { formatHex, parseColor, toRgb } from './parse'

/** The steps of a generated colour ramp, matching the Tailwind convention. */
export const SCALE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const
export type ScaleStep = (typeof SCALE_STEPS)[number]
export type ColorScale = Record<ScaleStep, string>

/**
 * Target lightness for each step.
 *
 * Hand-tuned rather than linear: the eye needs the light end spread out (50→200
 * are barely-there tints that must stay distinguishable as backgrounds) and
 * tolerates the dark end bunching (800→950 are all "dark", used for text).
 */
const STEP_LIGHTNESS: Record<ScaleStep, number> = {
  50: 0.977,
  100: 0.951,
  200: 0.9,
  300: 0.83,
  400: 0.74,
  500: 0.64,
  600: 0.56,
  700: 0.48,
  800: 0.4,
  900: 0.33,
  950: 0.23,
}

/**
 * Chroma multiplier per step. Very light and very dark colours cannot hold the
 * seed's chroma without leaving sRGB, and forcing it there is what makes
 * generated ramps look muddy at the ends.
 */
const STEP_CHROMA: Record<ScaleStep, number> = {
  50: 0.18,
  100: 0.3,
  200: 0.5,
  300: 0.72,
  400: 0.9,
  500: 1,
  600: 1,
  700: 0.94,
  800: 0.82,
  900: 0.7,
  950: 0.5,
}

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n)

/** Parse, or fall back to a mid grey rather than throwing into a black UI. */
export function toOklch(color: string): Oklch {
  return parseColor(color) ?? { l: 0.6, c: 0, h: 0, alpha: 1 }
}

/** Move a colour toward white, perceptually. `amount` is 0–1. */
export function lighten(color: string, amount: number): string {
  const c = toOklch(color)
  return formatHex({ ...c, l: clamp01(c.l + (1 - c.l) * amount) })
}

/** Move a colour toward black, perceptually. `amount` is 0–1. */
export function darken(color: string, amount: number): string {
  const c = toOklch(color)
  return formatHex({ ...c, l: clamp01(c.l * (1 - amount)) })
}

/** Set absolute perceptual lightness, keeping hue and chroma. */
export function withLightness(color: string, l: number): string {
  return formatHex({ ...toOklch(color), l: clamp01(l) })
}

/** Scale saturation. `1` is unchanged, `0` is grey, `>1` intensifies. */
export function saturate(color: string, factor: number): string {
  const c = toOklch(color)
  return formatHex({ ...c, c: Math.max(0, c.c * factor) })
}

export function withAlpha(color: string, alpha: number): string {
  return formatHex({ ...toOklch(color), alpha: clamp01(alpha) })
}

/**
 * Blend two colours in OKLab. `weight` is how much of `b` to take.
 *
 * Hue is interpolated the short way round the circle, so mixing red with
 * magenta does not detour through green.
 */
export function mix(a: string, b: string, weight = 0.5): string {
  const ca = toOklch(a)
  const cb = toOklch(b)
  const w = clamp01(weight)

  // A neutral has no hue to interpolate toward; borrow the other colour's.
  const ha = ca.c < 1e-4 ? cb.h : ca.h
  const hb = cb.c < 1e-4 ? ca.h : cb.h
  let delta = hb - ha
  if (delta > 180) delta -= 360
  if (delta < -180) delta += 360

  return formatHex({
    l: ca.l + (cb.l - ca.l) * w,
    c: ca.c + (cb.c - ca.c) * w,
    h: (((ha + delta * w) % 360) + 360) % 360,
    alpha: ca.alpha + (cb.alpha - ca.alpha) * w,
  })
}

/** WCAG 2.x contrast ratio, 1–21. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(toRgb(toOklch(a)))
  const lb = relativeLuminance(toRgb(toOklch(b)))
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * Pick the text colour that is legible on `background`.
 *
 * Returns whichever candidate has the better contrast ratio, so a project can
 * supply brand-tinted light/dark inks and still be guaranteed the readable one.
 * Used for every `*-foreground` token the palette generator produces, which is
 * what stops a custom project from shipping white text on a yellow button.
 */
export function readableForeground(
  background: string,
  light = '#ffffff',
  dark = '#09090b',
): string {
  return contrastRatio(background, light) >= contrastRatio(background, dark) ? light : dark
}

/** `true` when text at `foreground` on `background` clears WCAG AA body text. */
export function meetsContrastAA(foreground: string, background: string, large = false): boolean {
  return contrastRatio(foreground, background) >= (large ? 3 : 4.5)
}

/**
 * Build a full 50…950 ramp from a single seed.
 *
 * The seed's hue is preserved throughout and its chroma sets the ceiling, so a
 * muted brand colour yields a muted ramp rather than being pushed to a
 * saturation it was never meant to have.
 */
export function generateScale(seed: string): ColorScale {
  const base = toOklch(seed)
  const scale = {} as ColorScale
  for (const step of SCALE_STEPS) {
    scale[step] = formatHex({
      l: STEP_LIGHTNESS[step],
      c: base.c * STEP_CHROMA[step],
      h: base.h,
      alpha: 1,
    })
  }
  return scale
}

/**
 * The step of a generated ramp whose lightness is closest to the seed's.
 *
 * Lets a palette say "the brand colour lives here" so surrounding steps can be
 * used as its hover and active states without the pair drifting apart.
 */
export function nearestScaleStep(seed: string): ScaleStep {
  const { l } = toOklch(seed)
  let best: ScaleStep = 500
  let bestDelta = Infinity
  for (const step of SCALE_STEPS) {
    const delta = Math.abs(STEP_LIGHTNESS[step] - l)
    if (delta < bestDelta) {
      bestDelta = delta
      best = step
    }
  }
  return best
}

/** `true` when a colour is dark enough that a surface built on it needs light ink. */
export function isDark(color: string): boolean {
  return toOklch(color).l < 0.5
}
