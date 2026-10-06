import { useEffect, useRef, useState } from 'react'
import { AnimatedNumber, Button } from '@/components/ui'
import { monthName } from '@/lib/chunks'

export interface MonthReviewHeaderProps {
  month: string
  totalHours: number
  onShare: () => void
  isSharing: boolean
}

/**
 * Sticks to the top (z-sticky) for the whole page; past a sentinel placed
 * right beneath the full header, it compacts to just the numeral so it stays
 * out of the way of the subject cards without disappearing entirely.
 */
export function MonthReviewHeader({ month, totalHours, onShare, isSharing }: MonthReviewHeaderProps) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [isCompact, setIsCompact] = useState(false)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setIsCompact(!(entry?.isIntersecting ?? true)), { threshold: 0 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <div className="sticky top-0 z-sticky flex flex-col gap-3 bg-bg py-4">
        <div className="flex items-center justify-between gap-3">
          {isCompact ? (
            <AnimatedNumber
              value={totalHours}
              format={(value) => `${Math.round(value)}h`}
              className="text-title leading-none text-text"
            />
          ) : (
            <span className="text-[length:var(--text-small)] text-text-2">{monthName(month)}</span>
          )}
          <Button variant="ghost" size="sm" onClick={onShare} disabled={isSharing}>
            {isSharing ? 'Preparing…' : 'Share'}
          </Button>
        </div>

        {!isCompact && (
          <div className="flex flex-col gap-1">
            <AnimatedNumber
              value={totalHours}
              format={(value) => `${Math.round(value)}h`}
              duration={1.1}
              className="text-hero leading-none text-text"
            />
            <span className="text-[length:var(--text-small)] text-text-2">hours studied</span>
          </div>
        )}
      </div>
      <div ref={sentinelRef} aria-hidden="true" />
    </>
  )
}
