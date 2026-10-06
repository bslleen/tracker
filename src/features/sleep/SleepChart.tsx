import * as Popover from '@radix-ui/react-popover'
import { motion, useReducedMotion } from 'motion/react'
import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { SegmentedToggle } from '@/components/ui'
import { useContainerWidth } from '@/hooks/useContainerWidth'
import { buildLineAreaPaths } from '@/lib/chartPaths'
import { getOverlayRoot } from '@/lib/overlay-root'
import { parseDateKey } from '@/lib/streak'
import { CHART_SAMPLE_COUNT, RANGE_DAYS, resampleToFixedCount, type SleepPoint, type SleepRange } from './sleepChartData'

const CHART_HEIGHT = 200
const DEFAULT_TARGET_HOURS = 8
const CHART_MAX_HOURS = 12

const RANGE_OPTIONS: { value: SleepRange; label: string }[] = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '1y', label: '1Y' },
]

export interface SleepChartProps {
  points: SleepPoint[]
  range: SleepRange
  onRangeChange: (range: SleepRange) => void
  targetHours?: number
}

export function SleepChart({ points, range, onRangeChange, targetHours = DEFAULT_TARGET_HOURS }: SleepChartProps) {
  const prefersReducedMotion = useReducedMotion() ?? false
  const { ref: outerRef, width: containerWidth } = useContainerWidth<HTMLDivElement>()
  const svgRef = useRef<SVGSVGElement>(null)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const [anchor, setAnchor] = useState({ x: 0, y: 0 })

  const width = containerWidth || 1
  const values = resampleToFixedCount(points, CHART_SAMPLE_COUNT)
  const maxValue = Math.max(CHART_MAX_HOURS, targetHours, ...values)
  const { linePath, areaPath } = buildLineAreaPaths(values, width, CHART_HEIGHT, maxValue)
  const targetY = CHART_HEIGHT - (targetHours / maxValue) * CHART_HEIGHT

  const loggedHours = points.filter((p) => p.hours > 0)
  const average = loggedHours.length > 0 ? loggedHours.reduce((sum, p) => sum + p.hours, 0) / loggedHours.length : 0
  const min = loggedHours.length > 0 ? Math.min(...loggedHours.map((p) => p.hours)) : 0
  const max = loggedHours.length > 0 ? Math.max(...loggedHours.map((p) => p.hours)) : 0
  const summary =
    loggedHours.length === 0
      ? `No sleep logged in the last ${RANGE_DAYS[range]} days.`
      : `Average ${average.toFixed(1)} hours over the last ${RANGE_DAYS[range]} days, ranging from ${min.toFixed(1)} to ${max.toFixed(1)} hours.`

  function updateFromClientPoint(clientX: number, clientY: number) {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const localX = clientX - rect.left
    const index = Math.round((localX / rect.width) * (CHART_SAMPLE_COUNT - 1))
    const clamped = Math.max(0, Math.min(CHART_SAMPLE_COUNT - 1, index))
    setHoverIndex(clamped)
    setAnchor({ x: clientX, y: clientY })
  }

  function handlePointerMove(event: ReactPointerEvent<SVGRectElement>) {
    if (event.pointerType === 'mouse' || event.buttons > 0) {
      updateFromClientPoint(event.clientX, event.clientY)
    }
  }

  function clearHover() {
    setHoverIndex(null)
  }

  const hoverPoint =
    hoverIndex !== null
      ? (points[Math.round((hoverIndex / (CHART_SAMPLE_COUNT - 1)) * (points.length - 1))] ?? null)
      : null

  const transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-[length:var(--text-small)] text-text-2">Last {RANGE_DAYS[range]} days</span>
        <SegmentedToggle options={RANGE_OPTIONS} value={range} onChange={onRangeChange} ariaLabel="Chart range" />
      </div>

      <div ref={outerRef} className="@container relative">
        <svg
          ref={svgRef}
          width="100%"
          height={CHART_HEIGHT}
          viewBox={`0 0 ${width} ${CHART_HEIGHT}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={summary}
        >
          <defs>
            <linearGradient id="sleep-area-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>

          <line
            x1={0}
            x2={width}
            y1={targetY}
            y2={targetY}
            stroke="var(--text-2)"
            strokeDasharray="4 4"
            strokeWidth={1}
            aria-hidden="true"
          />

          <motion.path
            d={areaPath}
            fill="url(#sleep-area-gradient)"
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1, d: areaPath }}
            transition={transition}
          />
          <motion.path
            d={linePath}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={2}
            strokeLinecap="round"
            initial={prefersReducedMotion ? false : { pathLength: 0 }}
            animate={{ pathLength: 1, d: linePath }}
            transition={transition}
          />

          {hoverIndex !== null && (
            <>
              <line
                x1={(hoverIndex / (CHART_SAMPLE_COUNT - 1)) * width}
                x2={(hoverIndex / (CHART_SAMPLE_COUNT - 1)) * width}
                y1={0}
                y2={CHART_HEIGHT}
                stroke="var(--text-2)"
                strokeDasharray="2 2"
                aria-hidden="true"
              />
              <circle
                cx={(hoverIndex / (CHART_SAMPLE_COUNT - 1)) * width}
                cy={CHART_HEIGHT - (Math.min(values[hoverIndex]!, maxValue) / maxValue) * CHART_HEIGHT}
                r={4}
                fill="var(--accent)"
                aria-hidden="true"
              />
            </>
          )}

          <rect
            x={0}
            y={0}
            width={width}
            height={CHART_HEIGHT}
            fill="transparent"
            onPointerMove={handlePointerMove}
            onPointerDown={(event) => updateFromClientPoint(event.clientX, event.clientY)}
            onPointerUp={clearHover}
            onPointerLeave={clearHover}
          />
        </svg>

        <p className="sr-only">{summary}</p>

        <Popover.Root open={hoverPoint !== null}>
          <Popover.Anchor asChild>
            <span className="pointer-events-none fixed" style={{ left: anchor.x, top: anchor.y }} />
          </Popover.Anchor>
          {hoverPoint && (
            <Popover.Portal container={getOverlayRoot()}>
              <Popover.Content
                side="top"
                sideOffset={8}
                className="z-tooltip rounded-md border border-hairline bg-surface-2 px-3 py-2 text-[length:var(--text-small)] text-text shadow-lg"
                onOpenAutoFocus={(event) => event.preventDefault()}
              >
                <span className="font-medium">{parseDateKey(hoverPoint.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <span className="num ml-2 text-text-2">{hoverPoint.hours.toFixed(1)}h</span>
              </Popover.Content>
            </Popover.Portal>
          )}
        </Popover.Root>
      </div>
    </div>
  )
}
