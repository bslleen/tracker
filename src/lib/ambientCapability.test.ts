import { describe, expect, it } from 'vitest'
import { isLowPowerDevice } from './ambientCapability'

describe('isLowPowerDevice', () => {
  it('is false for a typical modern device', () => {
    expect(isLowPowerDevice(8, false)).toBe(false)
  })

  it('is true for 2 or fewer logical cores', () => {
    expect(isLowPowerDevice(2, false)).toBe(true)
    expect(isLowPowerDevice(1, false)).toBe(true)
  })

  it('is true when the user has opted into prefers-reduced-data', () => {
    expect(isLowPowerDevice(8, true)).toBe(true)
  })

  it('is false when hardwareConcurrency is unreported (not every browser exposes it) and data is not reduced', () => {
    expect(isLowPowerDevice(undefined, false)).toBe(false)
  })
})
