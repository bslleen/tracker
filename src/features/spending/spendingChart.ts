import type { SpendingEntry } from '@/data/types'

export interface CategoryTotal {
  category: string
  total: number
}

/** Category totals sorted largest first — the donut/treemap's own order, and the filtered list's category order. */
export function groupByCategory(entries: SpendingEntry[]): CategoryTotal[] {
  const totals = new Map<string, number>()
  for (const entry of entries) {
    totals.set(entry.category, (totals.get(entry.category) ?? 0) + entry.amount)
  }
  return Array.from(totals.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
}

export interface DayGroup {
  date: string
  entries: SpendingEntry[]
  total: number
}

/** Entries grouped by date, most recent day first — the list view's own grouping. */
export function groupByDay(entries: SpendingEntry[]): DayGroup[] {
  const byDate = new Map<string, SpendingEntry[]>()
  for (const entry of entries) {
    const existing = byDate.get(entry.date) ?? []
    existing.push(entry)
    byDate.set(entry.date, existing)
  }
  return Array.from(byDate.entries())
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([date, dayEntries]) => ({ date, entries: dayEntries, total: dayEntries.reduce((sum, e) => sum + e.amount, 0) }))
}

export function monthTotal(entries: SpendingEntry[]): number {
  return entries.reduce((sum, entry) => sum + entry.amount, 0)
}

const CATEGORY_ALPHA_STEPS = [100, 70, 45, 25, 60, 35, 85, 15]

/**
 * Category colors as alpha steps of the one accent green, cycling through a
 * fixed palette rather than shifting hue — CLAUDE.md: "spending categories
 * use shades of gray/green, never a rainbow." color-mix (plain percentage
 * literals, no calc()) blends accent-at-alpha over --text-2 for a muted
 * gray-green rather than a saturated green, matching "quieter than goals."
 */
export function categoryColor(index: number): string {
  const alpha = CATEGORY_ALPHA_STEPS[index % CATEGORY_ALPHA_STEPS.length]
  return `color-mix(in srgb, var(--accent) ${alpha}%, var(--text-2))`
}

export interface DonutSegment extends CategoryTotal {
  /** 0-1, cumulative — where this segment's arc starts around the circle. */
  startFraction: number
  /** 0-1 — this segment's own share of the circle. */
  fraction: number
  color: string
}

/** Cumulative fractions for stroke-dashoffset positioning — one pass, no trig needed until render time. */
export function computeDonutSegments(categories: CategoryTotal[]): DonutSegment[] {
  const total = categories.reduce((sum, c) => sum + c.total, 0)
  if (total <= 0) return []

  let cursor = 0
  return categories.map((category, index) => {
    const fraction = category.total / total
    const segment: DonutSegment = { ...category, startFraction: cursor, fraction, color: categoryColor(index) }
    cursor += fraction
    return segment
  })
}

export interface TreemapRect extends CategoryTotal {
  x: number
  y: number
  width: number
  height: number
  color: string
}

/**
 * A simple slice-and-dice treemap (alternating horizontal/vertical cuts,
 * sized proportionally to each category's share) — not a fully squarified
 * layout, but stable, dependency-free, and plenty for the handful of
 * spending categories this ever shows.
 */
export function computeTreemapLayout(categories: CategoryTotal[], width: number, height: number): TreemapRect[] {
  const total = categories.reduce((sum, c) => sum + c.total, 0)
  if (total <= 0 || width <= 0 || height <= 0) return []

  const rects: TreemapRect[] = []
  let offset = 0
  const horizontal = width >= height

  categories.forEach((category, index) => {
    const share = category.total / total
    const rect = horizontal
      ? { x: offset, y: 0, width: width * share, height }
      : { x: 0, y: offset, width, height: height * share }
    rects.push({ ...category, ...rect, color: categoryColor(index) })
    offset += horizontal ? rect.width : rect.height
  })

  return rects
}
