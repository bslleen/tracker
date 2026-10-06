import { motion, useReducedMotion, type PanInfo } from 'motion/react'
import { IconButton } from '@/components/ui'
import { TrashIcon } from '@/components/icons'
import type { SpendingEntry } from '@/data/types'
import { groupByDay } from './spendingChart'

const SWIPE_THRESHOLD = 72

export interface SpendingListProps {
  entries: SpendingEntry[]
  onDelete: (entry: SpendingEntry) => void
}

/** Simple rows grouped by day — swipe-to-delete on touch (Motion drag past a threshold), a hover delete icon on desktop. Both routes call the same onDelete, which owns the Undo toast. */
export function SpendingList({ entries, onDelete }: SpendingListProps) {
  const groups = groupByDay(entries)

  if (groups.length === 0) {
    return <p className="text-[length:var(--text-small)] text-text-2">No spending logged yet.</p>
  }

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.date} className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="text-[length:var(--text-small)] text-text-2">
              {new Date(`${group.date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            <span className="num text-[length:var(--text-small)] text-text-2">${Math.round(group.total)}</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {group.entries.map((entry) => (
              <SpendingRow key={entry.id} entry={entry} onDelete={() => onDelete(entry)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function SpendingRow({ entry, onDelete }: { entry: SpendingEntry; onDelete: () => void }) {
  const prefersReducedMotion = useReducedMotion()

  function handleDragEnd(_event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) {
    if (info.offset.x < -SWIPE_THRESHOLD) onDelete()
  }

  return (
    <div className="group relative overflow-hidden rounded-md">
      <div className="absolute inset-0 flex items-center justify-end bg-danger/20 px-4" aria-hidden="true">
        <TrashIcon className="text-danger" width={18} height={18} />
      </div>

      <motion.div
        drag={prefersReducedMotion ? false : 'x'}
        dragDirectionLock
        dragConstraints={{ left: -SWIPE_THRESHOLD - 24, right: 0 }}
        dragElastic={0.15}
        dragSnapToOrigin
        onDragEnd={handleDragEnd}
        className="relative flex min-h-11 items-center justify-between gap-3 bg-surface px-3 py-2"
      >
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-[length:var(--text-small)] text-text">{entry.category}</span>
          {entry.note && <span className="truncate text-[length:var(--text-small)] text-text-2">{entry.note}</span>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="num text-[length:var(--text-small)] text-text">${Math.round(entry.amount)}</span>
          <IconButton
            aria-label={`Delete ${entry.category} — $${Math.round(entry.amount)}`}
            variant="ghost"
            size="sm"
            className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
            onClick={onDelete}
          >
            <TrashIcon width={16} height={16} />
          </IconButton>
        </div>
      </motion.div>
    </div>
  )
}
