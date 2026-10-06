/**
 * Shifts --accent's hue in plain JS and returns a static rgb() string,
 * rather than CSS relative color syntax (`hsl(from var(--accent) calc(h +
 * Ndeg) s l)`). That looked like the more elegant approach — until it turned
 * out that `calc()` inside `hsl(from ...)` fails to parse in at least one
 * shipping Chromium build (153.0.8010.12), even for a 0deg shift: the whole
 * declaration is then invalid and the background falls back to transparent.
 * Caught via an actual Playwright screenshot during this phase, not by
 * reasoning about it — every filled chunk cell and the card's progress
 * hairline were silently invisible. Plain rgb() math has no such risk.
 */

/** Must match --accent in src/styles/tokens.css (#4ade80). */
const ACCENT_RGB = { r: 0x4a, g: 0xde, b: 0x80 }

export interface RgbColor {
  r: number
  g: number
  b: number
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l }

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h: number
  if (max === rn) h = ((gn - bn) / d) % 6
  else if (max === gn) h = (bn - rn) / d + 2
  else h = (rn - gn) / d + 4
  h *= 60
  if (h < 0) h += 360
  return { h, s, l }
}

export function hslToRgb(h: number, s: number, l: number): RgbColor {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r: number, g: number, b: number
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) }
}

/** 0-30deg hue shift off --accent, as a ready-to-use `rgb(...)` string. */
export function shiftAccentHue(shiftDeg: number): string {
  if (shiftDeg === 0) return `rgb(${ACCENT_RGB.r}, ${ACCENT_RGB.g}, ${ACCENT_RGB.b})`
  const hsl = rgbToHsl(ACCENT_RGB.r, ACCENT_RGB.g, ACCENT_RGB.b)
  const { r, g, b } = hslToRgb((hsl.h + shiftDeg + 360) % 360, hsl.s, hsl.l)
  return `rgb(${r}, ${g}, ${b})`
}

/** Shifts the hue of an arbitrary rgb()/hex color string (used by the canvas renderer, which reads --accent at draw time instead of assuming it). */
export function shiftColorHue(color: RgbColor, shiftDeg: number): string {
  if (shiftDeg === 0) return `rgb(${color.r}, ${color.g}, ${color.b})`
  const hsl = rgbToHsl(color.r, color.g, color.b)
  const { r, g, b } = hslToRgb((hsl.h + shiftDeg + 360) % 360, hsl.s, hsl.l)
  return `rgb(${r}, ${g}, ${b})`
}
