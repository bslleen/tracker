import type { HeatmapCell } from './heatmapGrid'
import { parseDateKey } from '@/lib/streak'

export interface HeatmapCellDetailsProps {
  cell: HeatmapCell
  goalNameFor: (goalId: string) => string
}

function formatCellDate(dateKeyValue: string): string {
  return parseDateKey(dateKeyValue).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

/** Shared content for the hover tooltip, the long-press popover, and the touch "selected day" bottom card — one place to keep them in sync. */
export function HeatmapCellDetails({ cell, goalNameFor }: HeatmapCellDetailsProps) {
  const entries = Object.entries(cell.byGoal)
    .filter(([, minutes]) => minutes > 0)
    .sort((a, b) => b[1] - a[1])

  return (
    <div className="flex min-w-36 flex-col gap-1.5">
      <div className="flex items-center justify-between gap-4">
        <span className="font-medium text-text">{formatCellDate(cell.date)}</span>
        <span className="num text-text-2">{cell.minutes}m</span>
      </div>
      {entries.length === 0 ? (
        <p className="text-text-2">No time logged</p>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {entries.map(([goalId, minutes]) => (
            <li key={goalId} className="flex items-center justify-between gap-4">
              <span className="text-text-2">{goalNameFor(goalId)}</span>
              <span className="num text-text-2">{minutes}m</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
