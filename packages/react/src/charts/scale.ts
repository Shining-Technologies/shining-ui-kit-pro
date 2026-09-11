/**
 * The maths behind the charts.
 *
 * Kept separate from the components so it can be unit-tested without a DOM,
 * and so a consumer building a chart the kit does not ship can reuse the tick
 * and path helpers rather than reinventing them.
 */

export interface Scale {
  /** Map a data value to a pixel position. */
  (value: number): number
  domain: [number, number]
  range: [number, number]
}

export function linearScale(domain: [number, number], range: [number, number]): Scale {
  const [d0, d1] = domain
  const [r0, r1] = range
  // A flat series has no span to divide by; centre it rather than emit NaN.
  const span = d1 - d0 || 1
  const scale = ((value: number) => r0 + ((value - d0) / span) * (r1 - r0)) as Scale
  scale.domain = domain
  scale.range = range
  return scale
}

/**
 * Round a domain out to values a human would choose.
 *
 * An axis labelled 0, 2.5, 5, 7.5, 10 is read instantly; one labelled
 * 0, 2.37, 4.74 … is not, even though it fits the data more tightly.
 */
export function niceDomain(min: number, max: number, tickCount = 5): [number, number] {
  if (!isFinite(min) || !isFinite(max)) return [0, 1]
  if (min === max) return min === 0 ? [0, 1] : [Math.min(0, min), Math.max(0, max * 1.2)]

  const step = niceStep((max - min) / Math.max(1, tickCount))
  return [Math.floor(min / step) * step, Math.ceil(max / step) * step]
}

/** The nearest 1, 2, 5 or 10 × 10ⁿ at or above `rough`. */
function niceStep(rough: number): number {
  const magnitude = 10 ** Math.floor(Math.log10(Math.abs(rough) || 1))
  const normalized = rough / magnitude
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return step * magnitude
}

export function ticks([min, max]: [number, number], count = 5): number[] {
  const step = niceStep((max - min) / Math.max(1, count))
  const out: number[] = []
  // Accumulating with multiplication rather than repeated addition keeps the
  // floating-point error from drifting a "10" into "9.999999999999998".
  for (let i = 0; min + i * step <= max + step / 1000; i++) out.push(round(min + i * step))
  return out
}

function round(n: number): number {
  return Math.abs(n) < 1e-10 ? 0 : Number(n.toPrecision(12))
}

export interface Point {
  x: number
  y: number
}

/** A polyline through the points. */
export function linePath(points: Point[]): string {
  if (!points.length) return ''
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
}

/**
 * A smooth curve through the points, as a series of cubic segments.
 *
 * Control points are placed along the *local* slope rather than through a
 * global spline, which is what keeps the curve from overshooting into
 * impossible territory — a visitor count dipping below zero between two
 * positive days, say.
 */
export function smoothPath(points: Point[], tension = 0.32): string {
  if (points.length < 2) return linePath(points)

  const parts: string[] = [`M${points[0]!.x},${points[0]!.y}`]
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]!
    const p1 = points[i]!
    const p2 = points[i + 1]!
    const p3 = points[i + 2] ?? p2

    const c1 = {
      x: p1.x + ((p2.x - p0.x) / 6) * tension * 2,
      y: p1.y + ((p2.y - p0.y) / 6) * tension * 2,
    }
    const c2 = {
      x: p2.x - ((p3.x - p1.x) / 6) * tension * 2,
      y: p2.y - ((p3.y - p1.y) / 6) * tension * 2,
    }
    parts.push(`C${c1.x},${c1.y} ${c2.x},${c2.y} ${p2.x},${p2.y}`)
  }
  return parts.join(' ')
}

/** Close a line down to a baseline, producing the area beneath it. */
export function areaPath(points: Point[], baseline: number, smooth = false): string {
  if (!points.length) return ''
  const top = smooth ? smoothPath(points) : linePath(points)
  const last = points[points.length - 1]!
  return `${top} L${last.x},${baseline} L${points[0]!.x},${baseline} Z`
}

/** A pie or donut segment. `inner` of 0 gives a solid slice. */
export function arcPath(
  cx: number,
  cy: number,
  outer: number,
  inner: number,
  startAngle: number,
  endAngle: number,
): string {
  // A full circle cannot be drawn as one arc — the start and end points
  // coincide and the renderer draws nothing at all.
  const sweep = endAngle - startAngle
  if (sweep >= Math.PI * 2 - 1e-6) return fullRing(cx, cy, outer, inner)

  const largeArc = sweep > Math.PI ? 1 : 0
  const p = (r: number, a: number) => `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`

  if (inner <= 0) {
    return `M${cx},${cy} L${p(outer, startAngle)} A${outer},${outer} 0 ${largeArc} 1 ${p(outer, endAngle)} Z`
  }
  return [
    `M${p(outer, startAngle)}`,
    `A${outer},${outer} 0 ${largeArc} 1 ${p(outer, endAngle)}`,
    `L${p(inner, endAngle)}`,
    `A${inner},${inner} 0 ${largeArc} 0 ${p(inner, startAngle)}`,
    'Z',
  ].join(' ')
}

function fullRing(cx: number, cy: number, outer: number, inner: number): string {
  const ring = (r: number, dir: number) =>
    `M${cx - r},${cy} A${r},${r} 0 1 ${dir} ${cx + r},${cy} A${r},${r} 0 1 ${dir} ${cx - r},${cy}`
  return inner > 0 ? `${ring(outer, 1)} ${ring(inner, 0)}` : ring(outer, 1)
}

/**
 * Format a number for an axis label.
 *
 * Compact by default: an axis reading "1.2M" is legible at 11px where
 * "1,200,000" is not, and the exact figure belongs in the tooltip anyway.
 */
export function formatCompact(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1e9) return `${trim(value / 1e9)}B`
  if (abs >= 1e6) return `${trim(value / 1e6)}M`
  if (abs >= 1e3) return `${trim(value / 1e3)}k`
  return trim(value)
}

function trim(n: number): string {
  return Number(n.toFixed(1)).toString()
}
