import { describe, expect, it } from 'vitest'
import { buildLineAreaPaths } from './chartPaths'

describe('buildLineAreaPaths', () => {
  it('starts the line with M and continues with L commands', () => {
    const { linePath } = buildLineAreaPaths([0, 5, 10], 100, 50, 10)
    expect(linePath.startsWith('M')).toBe(true)
    expect(linePath.match(/L/g)).toHaveLength(2)
  })

  it('maps the max value to y=0 (top) and 0 to y=height (bottom)', () => {
    const { linePath } = buildLineAreaPaths([0, 10], 100, 50, 10)
    expect(linePath).toBe('M0.00,50.00 L100.00,0.00')
  })

  it('closes the area back down to the baseline, under both ends', () => {
    const { areaPath } = buildLineAreaPaths([0, 10], 100, 50, 10)
    expect(areaPath.endsWith('Z')).toBe(true)
    expect(areaPath).toContain('L100.00,50')
    expect(areaPath).toContain('L0.00,50 Z')
  })

  it('clamps values above max and below 0', () => {
    const { linePath } = buildLineAreaPaths([-5, 20], 100, 50, 10)
    expect(linePath).toBe('M0.00,50.00 L100.00,0.00')
  })

  it('is empty for no values or a zero-size container', () => {
    expect(buildLineAreaPaths([], 100, 50, 10).linePath).toBe('')
    expect(buildLineAreaPaths([1, 2], 0, 50, 10).linePath).toBe('')
  })
})
