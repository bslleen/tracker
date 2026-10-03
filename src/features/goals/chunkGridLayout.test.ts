import { describe, expect, it } from 'vitest'
import { computeChunkGridLayout, getNeighborIndices, MAX_CELL, MIN_CELL } from './chunkGridLayout'

const CHUNK_SIZES = [5, 10, 15, 25, 30, 60]
const WIDTHS = [240, 360, 600, 1200]

describe('computeChunkGridLayout', () => {
  it.each(CHUNK_SIZES.flatMap((chunkMinutes) => WIDTHS.map((containerWidth) => ({ chunkMinutes, containerWidth }))))(
    'chunkMinutes=$chunkMinutes containerWidth=$containerWidth produces a sane, non-overflowing layout',
    ({ chunkMinutes, containerWidth }) => {
      const layout = computeChunkGridLayout({ containerWidth, chunkMinutes, pointerKind: 'fine' })

      expect(layout.columns).toBeGreaterThan(0)
      expect(Number.isInteger(layout.columns)).toBe(true)
      expect(layout.cellSize).toBeGreaterThanOrEqual(MIN_CELL)
      expect(layout.cellSize).toBeLessThanOrEqual(MAX_CELL)

      // The row must fit: columns * cellSize + gaps between them <= containerWidth,
      // except where cellSize had to be clamped up to MIN_CELL on a too-narrow container.
      const rowWidth = layout.columns * layout.cellSize + layout.gap * (layout.columns - 1)
      if (layout.cellSize > MIN_CELL) {
        expect(rowWidth).toBeLessThanOrEqual(containerWidth + 0.5)
      }
    },
  )

  it('picks the most columns that still keep cells above the pointer minimum', () => {
    // 5-minute chunks: chunksPerHour = 12, candidates = [24, 12, 6].
    // At 1200px, even 24 columns comfortably clears 14px cells.
    const wide = computeChunkGridLayout({ containerWidth: 1200, chunkMinutes: 5, pointerKind: 'fine' })
    expect(wide.columns).toBe(24)

    // At 360px, 24 columns would be far too small, but 12 fits.
    const narrow = computeChunkGridLayout({ containerWidth: 360, chunkMinutes: 5, pointerKind: 'fine' })
    expect(narrow.columns).toBe(12)
  })

  it('requires larger cells on touch than pointer devices, which can push columns down', () => {
    const pointer = computeChunkGridLayout({ containerWidth: 150, chunkMinutes: 15, pointerKind: 'fine' })
    const touch = computeChunkGridLayout({ containerWidth: 150, chunkMinutes: 15, pointerKind: 'coarse' })
    expect(touch.columns).toBeLessThan(pointer.columns)
  })

  it('groups chunk sizes that do not divide an hour into flat rows of 10', () => {
    const layout = computeChunkGridLayout({ containerWidth: 600, chunkMinutes: 25, pointerKind: 'fine' })
    expect(layout.columns).toBe(10)
    expect(layout.rowsPerHour).toBeNull()
  })

  it('marks one row per hour when the chosen columns equal chunksPerHour', () => {
    // 5-minute chunks: chunksPerHour = 12, candidates = [24, 12, 6]. At
    // 360px, 24 columns is too cramped (~11px) but 12 fits (~26px) — one
    // row per hour.
    const layout = computeChunkGridLayout({ containerWidth: 360, chunkMinutes: 5, pointerKind: 'fine' })
    expect(layout.columns).toBe(12)
    expect(layout.rowsPerHour).toBe(1)
  })

  it('marks two rows per hour when the chosen columns equal half chunksPerHour', () => {
    // 5-minute chunks again, but narrow enough (150px) that even 12 columns
    // doesn't clear 14px, falling back to 6 (half an hour per row).
    const layout = computeChunkGridLayout({ containerWidth: 150, chunkMinutes: 5, pointerKind: 'fine' })
    expect(layout.columns).toBe(6)
    expect(layout.rowsPerHour).toBe(2)
  })

  it('switches gap to 6px once cells are 22px or larger', () => {
    const layout = computeChunkGridLayout({ containerWidth: 1200, chunkMinutes: 60, pointerKind: 'fine' })
    expect(layout.cellSize).toBeGreaterThanOrEqual(22)
    expect(layout.gap).toBe(6)
  })
})

describe('getNeighborIndices', () => {
  it('returns a 2D neighborhood, not a flat +/- radius in index space', () => {
    // 5 columns, radius 1 around index 7 (row 1, col 2): expect the 3x3 block.
    const indices = getNeighborIndices(7, 25, 5, 1).sort((a, b) => a - b)
    expect(indices).toEqual([1, 2, 3, 6, 7, 8, 11, 12, 13])
  })

  it('does not wrap across row edges', () => {
    // 5 columns, index 5 is the start of row 1 (col 0) — a neighbor to the
    // "left" would be col -1, which must be excluded, not wrap to the
    // previous row's last column.
    const indices = getNeighborIndices(5, 25, 5, 1)
    expect(indices).not.toContain(4)
  })

  it('clamps at the grid edges', () => {
    const indices = getNeighborIndices(0, 25, 5, 2)
    expect(indices.every((index) => index >= 0 && index < 25)).toBe(true)
  })
})
