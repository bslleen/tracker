export interface LineAreaPaths {
  linePath: string
  areaPath: string
}

/**
 * SVG path `d` strings for a simple evenly-spaced line/area chart. Values
 * map left-to-right at equal intervals (no x-scale needed — every chart
 * that uses this already resamples to a fixed point count first); y is
 * inverted since SVG y grows downward. Pure and dependency-free rather than
 * routed through visx's render-prop API, specifically so the caller can hand
 * the resulting string straight to a `motion.path`'s `animate={{ d }}` for a
 * smooth morph between ranges (see SleepChart.tsx).
 */
export function buildLineAreaPaths(values: number[], width: number, height: number, maxValue: number): LineAreaPaths {
  if (values.length === 0 || width <= 0 || height <= 0) {
    return { linePath: '', areaPath: '' }
  }

  const safeMax = maxValue > 0 ? maxValue : 1
  const stepX = values.length > 1 ? width / (values.length - 1) : 0
  const points = values.map((value, index) => {
    const x = index * stepX
    const y = height - (Math.min(Math.max(value, 0), safeMax) / safeMax) * height
    return [x, y] as const
  })

  const linePath = points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
  const firstX = points[0]![0].toFixed(2)
  const lastX = points[points.length - 1]![0].toFixed(2)
  const areaPath = `${linePath} L${lastX},${height} L${firstX},${height} Z`

  return { linePath, areaPath }
}
