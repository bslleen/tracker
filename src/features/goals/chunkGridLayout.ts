export type PointerKind = 'fine' | 'coarse'

export const MIN_CELL = 12
export const MAX_CELL = 26
const MIN_CELL_POINTER = 14
const MIN_CELL_TOUCH = 18
const GAP_SMALL = 4
const GAP_LARGE = 6
const GAP_LARGE_THRESHOLD = 22
/** Chunk sizes that don't evenly divide an hour (e.g. 25 min) group flatly by 10 instead of aligning to hours. */
const IRREGULAR_ROW_SIZE = 10

export interface ChunkGridLayout {
  columns: number
  cellSize: number
  gap: number
  /** Chunks per hour, used for hour-row grouping. Not meaningful for irregular chunk sizes. */
  chunksPerHour: number
  /** How many grid rows make up one hour of rows — 1, 2, or null if hour boundaries don't land on a row edge. */
  rowsPerHour: number | null
}

function cellSizeForColumns(containerWidth: number, columns: number, gap: number): number {
  if (columns <= 0) return 0
  const totalGap = gap * (columns - 1)
  return (containerWidth - totalGap) / columns
}

/** Candidate column counts for an hour-aligned chunk size, largest (most columns) first. */
function candidateColumns(chunkMinutes: number): number[] | null {
  if (60 % chunkMinutes !== 0) return null
  const perHour = 60 / chunkMinutes
  const candidates = [perHour * 2, perHour]
  if (perHour % 2 === 0) candidates.push(perHour / 2)
  return candidates
}

export function computeChunkGridLayout(input: {
  containerWidth: number
  chunkMinutes: number
  pointerKind: PointerKind
}): ChunkGridLayout {
  const { containerWidth, chunkMinutes, pointerKind } = input
  const minCell = pointerKind === 'coarse' ? MIN_CELL_TOUCH : MIN_CELL_POINTER
  const chunksPerHour = 60 / chunkMinutes
  const candidates = candidateColumns(chunkMinutes)

  let columns: number
  if (candidates) {
    columns = Math.min(...candidates)
    for (const candidate of candidates) {
      if (cellSizeForColumns(containerWidth, candidate, GAP_SMALL) >= minCell) {
        columns = candidate
        break
      }
    }
  } else {
    columns = IRREGULAR_ROW_SIZE
  }

  let gap = GAP_SMALL
  let cellSize = cellSizeForColumns(containerWidth, columns, gap)
  if (cellSize >= GAP_LARGE_THRESHOLD) {
    gap = GAP_LARGE
    cellSize = cellSizeForColumns(containerWidth, columns, gap)
  }
  cellSize = Math.min(MAX_CELL, Math.max(MIN_CELL, cellSize))

  let rowsPerHour: number | null = null
  if (candidates) {
    if (columns === chunksPerHour) rowsPerHour = 1
    else if (columns === chunksPerHour / 2) rowsPerHour = 2
    // columns === chunksPerHour * 2: two hours per row, no row edge lands on an hour boundary.
  }

  return { columns, cellSize, gap, chunksPerHour, rowsPerHour }
}

/**
 * Indices within `radius` rows/columns of `centerIndex`, for the hover
 * proximity effect. A 2D neighborhood (not just +/- radius in the flat index
 * space), so it doesn't wrap incorrectly across row edges.
 */
export function getNeighborIndices(centerIndex: number, total: number, columns: number, radius: number): number[] {
  if (columns <= 0) return []
  const centerRow = Math.floor(centerIndex / columns)
  const centerCol = centerIndex % columns

  const indices: number[] = []
  for (let rowOffset = -radius; rowOffset <= radius; rowOffset += 1) {
    const row = centerRow + rowOffset
    if (row < 0) continue
    for (let colOffset = -radius; colOffset <= radius; colOffset += 1) {
      const col = centerCol + colOffset
      if (col < 0 || col >= columns) continue
      const index = row * columns + col
      if (index < 0 || index >= total) continue
      indices.push(index)
    }
  }
  return indices
}
