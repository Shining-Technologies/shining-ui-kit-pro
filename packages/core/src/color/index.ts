/**
 * A small, dependency-free colour toolkit.
 *
 * It exists so a project palette can be *generated* from a couple of seed
 * colours rather than hand-authored token by token — which is what makes
 * "pick a brand colour" a complete theming action instead of the first of
 * forty. Everything works in OKLab so the derivations are perceptual.
 */
export type { Oklch, Rgb } from './oklch'
export { gamutFit, oklchToRgb, relativeLuminance, rgbToOklch } from './oklch'
export { formatHex, formatOklch, parseColor, toRgb } from './parse'
export {
  SCALE_STEPS,
  contrastRatio,
  darken,
  generateScale,
  isDark,
  lighten,
  meetsContrastAA,
  mix,
  nearestScaleStep,
  readableForeground,
  saturate,
  toOklch,
  withAlpha,
  withLightness,
} from './manipulate'
export type { ColorScale, ScaleStep } from './manipulate'
