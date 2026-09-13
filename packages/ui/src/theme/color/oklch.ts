/**
 * sRGB ⇄ OKLCH, with no dependencies.
 *
 * The kit generates whole palettes from a handful of seed colours, and every
 * one of those derivations — a hover tint, a readable foreground, a 50…950
 * scale — is a *perceptual* operation. Doing them in sRGB produces the classic
 * artefacts: a "10% lighter" blue that reads as grey, a scale whose middle
 * steps bunch up. OKLab is uniform enough that the naive arithmetic is right.
 *
 * Implementation follows Björn Ottosson's reference conversion.
 */

export interface Oklch {
  /** Perceptual lightness, 0–1. */
  l: number
  /** Chroma, 0–~0.4 for displayable sRGB. */
  c: number
  /** Hue angle in degrees, 0–360. */
  h: number
  /** Alpha, 0–1. */
  alpha: number
}

export interface Rgb {
  /** 0–1. */
  r: number
  g: number
  b: number
  alpha: number
}

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n)

/** sRGB transfer function (gamma → linear). */
function toLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

/** Inverse sRGB transfer function (linear → gamma). */
function toGamma(c: number): number {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
}

export function rgbToOklch({ r, g, b, alpha }: Rgb): Oklch {
  const lr = toLinear(r)
  const lg = toLinear(g)
  const lb = toLinear(b)

  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)

  const okL = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const okA = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const okB = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s

  const c = Math.sqrt(okA * okA + okB * okB)
  // A neutral has no meaningful hue; pin it to 0 so scales stay grey.
  const h = c < 1e-6 ? 0 : ((Math.atan2(okB, okA) * 180) / Math.PI + 360) % 360

  return { l: okL, c, h, alpha }
}

export function oklchToRgb({ l: okL, c, h, alpha }: Oklch): Rgb {
  const hr = (h * Math.PI) / 180
  const okA = c * Math.cos(hr)
  const okB = c * Math.sin(hr)

  const l_ = okL + 0.3963377774 * okA + 0.2158037573 * okB
  const m_ = okL - 0.1055613458 * okA - 0.0638541728 * okB
  const s_ = okL - 0.0894841775 * okA - 1.291485548 * okB

  const l = l_ * l_ * l_
  const m = m_ * m_ * m_
  const s = s_ * s_ * s_

  return {
    r: clamp01(toGamma(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)),
    g: clamp01(toGamma(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)),
    b: clamp01(toGamma(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)),
    alpha,
  }
}

/**
 * Pull chroma down until the colour fits inside sRGB.
 *
 * Clamping the channels instead — which is what `oklchToRgb` does on its own —
 * shifts the hue, so a "more saturated" brand colour can come back a different
 * colour entirely. Reducing chroma keeps hue and lightness and only gives up
 * the saturation the display cannot show.
 */
export function gamutFit(color: Oklch): Oklch {
  if (color.l <= 0) return { ...color, l: 0, c: 0 }
  if (color.l >= 1) return { ...color, l: 1, c: 0 }
  if (inGamut(color)) return color

  let lo = 0
  let hi = color.c
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2
    if (inGamut({ ...color, c: mid })) lo = mid
    else hi = mid
  }
  return { ...color, c: lo }
}

function inGamut(color: Oklch): boolean {
  const hr = (color.h * Math.PI) / 180
  const okA = color.c * Math.cos(hr)
  const okB = color.c * Math.sin(hr)

  const l_ = color.l + 0.3963377774 * okA + 0.2158037573 * okB
  const m_ = color.l - 0.1055613458 * okA - 0.0638541728 * okB
  const s_ = color.l - 0.0894841775 * okA - 1.291485548 * okB

  const l = l_ * l_ * l_
  const m = m_ * m_ * m_
  const s = s_ * s_ * s_

  const r = toGamma(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)
  const g = toGamma(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)
  const b = toGamma(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)

  const eps = 1e-4
  return r >= -eps && r <= 1 + eps && g >= -eps && g <= 1 + eps && b >= -eps && b <= 1 + eps
}

/** Relative luminance per WCAG 2.x, used for contrast ratios. */
export function relativeLuminance({ r, g, b }: Rgb): number {
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}
