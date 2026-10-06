import { forwardRef } from 'react'
import { OverlayPortal } from '@/components/OverlayPortal'

export const SHARE_WIDTH = 1080
export const SHARE_HEIGHT = 1920

export interface ReviewShareCardProps {
  year: string
  totalHours: number
  totalChunks: number
  topSubjectName: string
}

/** Same off-screen-in-#overlay-root technique as MonthShareCard.tsx, at a 9:16 (1080x1920) story-shaped canvas instead of 1080x1350. */
export const ReviewShareCard = forwardRef<HTMLDivElement, ReviewShareCardProps>(function ReviewShareCard(
  { year, totalHours, totalChunks, topSubjectName },
  ref,
) {
  return (
    <OverlayPortal>
      <div
        ref={ref}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 flex flex-col items-center justify-center bg-bg text-text"
        style={{ left: -SHARE_WIDTH * 2, width: SHARE_WIDTH, height: SHARE_HEIGHT, padding: 96, gap: 64 }}
      >
        <span className="text-[length:var(--text-small)] tracking-wide text-text-2 uppercase">Chunks</span>

        <div className="flex flex-col items-center gap-3">
          <span className="text-[length:var(--text-small)] text-text-2">Your {year}</span>
          <span className="num leading-none" style={{ fontSize: 160 }}>
            {Math.round(totalHours)}h
          </span>
          <span className="text-[length:var(--text-small)] text-text-2">studied</span>
        </div>

        <div className="flex flex-col items-center gap-3">
          <span className="num leading-none" style={{ fontSize: 120 }}>
            {totalChunks}
          </span>
          <span className="text-[length:var(--text-small)] text-text-2">chunks filled</span>
        </div>

        {topSubjectName && (
          <div className="flex flex-col items-center gap-3">
            <span style={{ fontSize: 56 }}>{topSubjectName}</span>
            <span className="text-[length:var(--text-small)] text-text-2">top subject</span>
          </div>
        )}
      </div>
    </OverlayPortal>
  )
})
