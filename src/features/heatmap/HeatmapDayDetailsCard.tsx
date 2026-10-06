import { IconButton } from '@/components/ui'
import { XIcon } from '@/components/icons'
import type { HeatmapCell } from './heatmapGrid'
import { HeatmapCellDetails } from './HeatmapCellDetails'

export interface HeatmapDayDetailsCardProps {
  cell: HeatmapCell
  goalNameFor: (goalId: string) => string
  onClose: () => void
}

/** The touch equivalent of the hover tooltip — a normal card in the page's own flow below the heatmap, never a floating overlay. */
export function HeatmapDayDetailsCard({ cell, goalNameFor, onClose }: HeatmapDayDetailsCardProps) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-hairline bg-surface p-4 text-[length:var(--text-small)]">
      <HeatmapCellDetails cell={cell} goalNameFor={goalNameFor} />
      <IconButton aria-label="Close day details" variant="ghost" size="sm" onClick={onClose}>
        <XIcon width={16} height={16} />
      </IconButton>
    </div>
  )
}
