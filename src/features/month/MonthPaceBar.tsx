export interface MonthPaceBarProps {
  /** 0-100 — studied minutes as a percentage of planned minutes this month. */
  percent: number
  /** 0-100 — how far through the month today is, so the user can see ahead/behind at a glance. */
  paceMarkerPercent: number
}

/** One thin full-width bar: the accent fill is progress, the faint tick is "where you should be today". */
export function MonthPaceBar({ percent, paceMarkerPercent }: MonthPaceBarProps) {
  const clampedPercent = Math.min(100, Math.max(0, percent))
  const clampedMarker = Math.min(100, Math.max(0, paceMarkerPercent))

  return (
    <div
      className="relative h-1 w-full overflow-visible rounded-full bg-chunk-empty"
      role="img"
      aria-label={`${Math.round(clampedPercent)}% of this month's plan studied, ${Math.round(clampedMarker)}% of the month elapsed`}
    >
      <div
        className="h-full rounded-full bg-accent"
        style={{ width: `${clampedPercent}%`, transition: 'width var(--duration-slower) var(--ease-out)' }}
      />
      <div
        aria-hidden="true"
        className="absolute top-1/2 h-2.5 w-px -translate-y-1/2 bg-text-2/60"
        style={{ left: `${clampedMarker}%`, transition: 'left var(--duration-slower) var(--ease-out)' }}
      />
    </div>
  )
}
