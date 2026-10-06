import { describe, expect, it } from 'vitest'
import { hslToRgb, rgbToHsl, shiftAccentHue, shiftColorHue } from './color'

describe('rgbToHsl / hslToRgb round trip', () => {
  it('round-trips the accent color (#4ade80) without drift', () => {
    const hsl = rgbToHsl(0x4a, 0xde, 0x80)
    const rgb = hslToRgb(hsl.h, hsl.s, hsl.l)
    expect(rgb).toEqual({ r: 0x4a, g: 0xde, b: 0x80 })
  })
})

describe('shiftAccentHue', () => {
  it('returns the unshifted accent color for a 0deg shift', () => {
    expect(shiftAccentHue(0)).toBe('rgb(74, 222, 128)')
  })

  it('produces a different, still-valid color for a non-zero shift', () => {
    const shifted = shiftAccentHue(15)
    expect(shifted).toMatch(/^rgb\(\d+, \d+, \d+\)$/)
    expect(shifted).not.toBe(shiftAccentHue(0))
  })

  it('wraps cleanly past 360 degrees', () => {
    expect(shiftAccentHue(30)).toBe(shiftAccentHue(30 - 360))
  })
})

describe('shiftColorHue', () => {
  it('matches shiftAccentHue when given the same base color', () => {
    expect(shiftColorHue({ r: 0x4a, g: 0xde, b: 0x80 }, 12)).toBe(shiftAccentHue(12))
  })
})
