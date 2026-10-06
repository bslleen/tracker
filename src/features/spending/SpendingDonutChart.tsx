import { motion } from 'motion/react'
import { AnimatedNumber } from '@/components/ui'
import type { DonutSegment } from './spendingChart'

const SIZE = 180
const STROKE_WIDTH = 22
const RADIUS = (SIZE - STROKE_WIDTH) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export interface SpendingDonutChartProps {
  segments: DonutSegment[]
  total: number
  selectedCategory: string | null
  onSelectCategory: (category: string | null) => void
  prefersReducedMotion: boolean
}

/** A donut built from one full-circle `<circle>` per category, each rotated to its start angle and revealed via stroke-dashoffset — the classic dependency-free SVG donut technique, matching CLAUDE.md's "segments animating in (stroke-dashoffset)" literally. */
export function SpendingDonutChart({ segments, total, selectedCategory, onSelectCategory, prefersReducedMotion }: SpendingDonutChartProps) {
  return (
    <div className="relative mx-auto" style={{ width: SIZE, height: SIZE }}>
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={`Total spending $${Math.round(total)} this month, split across ${segments.length} categor${segments.length === 1 ? 'y' : 'ies'}`}
      >
        <g style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}>
          <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="var(--chunk-empty)" strokeWidth={STROKE_WIDTH} />
          {segments.map((segment, index) => {
            const isDimmed = selectedCategory !== null && selectedCategory !== segment.category
            const dashLength = segment.fraction * CIRCUMFERENCE
            const finalOffset = CIRCUMFERENCE - dashLength

            return (
              <motion.circle
                key={segment.category}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={segment.color}
                strokeWidth={STROKE_WIDTH}
                strokeDasharray={CIRCUMFERENCE}
                style={{ transform: `rotate(${segment.startFraction * 360}deg)`, transformOrigin: '50% 50%', cursor: 'pointer' }}
                animate={{ strokeDashoffset: finalOffset, opacity: isDimmed ? 0.3 : 1 }}
                initial={prefersReducedMotion ? false : { strokeDashoffset: CIRCUMFERENCE }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : { strokeDashoffset: { duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: index * 0.08 }, opacity: { duration: 0.2 } }
                }
                onClick={() => onSelectCategory(selectedCategory === segment.category ? null : segment.category)}
              />
            )
          })}
        </g>
      </svg>

      <button
        type="button"
        onClick={() => onSelectCategory(null)}
        aria-label={selectedCategory ? `Clear filter (currently ${selectedCategory})` : 'Month total'}
        className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 rounded-full"
      >
        <AnimatedNumber value={total} format={(value) => `$${Math.round(value)}`} duration={0.9} className="text-title leading-none text-text" />
        <span className="text-[length:var(--text-small)] text-text-2">this month</span>
      </button>
    </div>
  )
}
