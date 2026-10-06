import { forwardRef } from 'react'
import type { Goal } from '@/data/types'
import { OverlayPortal } from '@/components/OverlayPortal'
import { shiftAccentHue } from '@/lib/color'
import { chunkCount, monthName, percentComplete } from '@/lib/chunks'

export const SHARE_WIDTH = 1080
export const SHARE_HEIGHT = 1350

export interface MonthShareCardProps {
  month: string
  totalHours: number
  goals: Goal[]
}

/**
 * Rendered off-screen at a fixed 1080x1350 (not scaled/transformed down for
 * display — html-to-image captures it at its real size), inside its own
 * <OverlayPortal> so it lives in #overlay-root rather than the page's own
 * layout. `pointer-events-none` + `aria-hidden` + pushed far outside the
 * viewport via `left`, not `display: none` (which html-to-image can't
 * rasterize) or `opacity: 0` (which would make the capture blank).
 */
export const MonthShareCard = forwardRef<HTMLDivElement, MonthShareCardProps>(function MonthShareCard(
  { month, totalHours, goals },
  ref,
) {
  return (
    <OverlayPortal>
      <div
        ref={ref}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 flex flex-col bg-bg text-text"
        style={{ left: -SHARE_WIDTH * 2, width: SHARE_WIDTH, height: SHARE_HEIGHT, padding: 72, gap: 48 }}
      >
        <span className="text-[length:var(--text-small)] tracking-wide text-text-2 uppercase">Chunks</span>

        <div className="flex flex-col gap-2">
          <span className="text-[length:var(--text-small)] text-text-2">{monthName(month)}</span>
          <span className="num leading-none" style={{ fontSize: 180 }}>
            {totalHours}h
          </span>
          <span className="text-[length:var(--text-small)] text-text-2">studied this month</span>
        </div>

        <div className="flex flex-1 flex-col justify-center gap-7">
          {goals.slice(0, 8).map((goal) => {
            const total = chunkCount(goal.totalMinutes, goal.chunkMinutes)
            const percent = Math.round(percentComplete(goal.completedChunks, total))
            return (
              <div key={goal.id} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[length:var(--text-body)]">{goal.name}</span>
                  <span className="num text-[length:var(--text-body)] text-text-2">{percent}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-chunk-empty">
                  <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: shiftAccentHue(goal.hue) }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </OverlayPortal>
  )
})
