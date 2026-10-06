import { describe, expect, it } from 'vitest'
import { accentOverlayColor, hslToRgb, rgbToHsl, shiftAccentHue, shiftColorHue } from './color'

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

describe('accentOverlayColor', () => {
  it('is exactly --chunk-empty at 0% (the heatmap\'s empty-day level)', () => {
    expect(accentOverlayColor(0, 0)).toBe('var(--chunk-empty)')
  })

  it('is the plain accent color at 100% (no need to mix with empty)', () => {
    expect(accentOverlayColor(0, 100)).toBe(shiftAccentHue(0))
  })

  it('mixes via color-mix() for intermediate levels, with no calc()', () => {
    const color = accentOverlayColor(0, 40)
    expect(color).toContain('color-mix(in srgb,')
    expect(color).toContain('40%')
    expect(color).not.toContain('calc(')
  })

  it('reflects a hue shift inside the mixed color', () => {
    expect(accentOverlayColor(15, 40)).toContain(shiftAccentHue(15))
  })
})
