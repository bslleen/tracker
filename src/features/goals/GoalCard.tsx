import { motion } from 'motion/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Goal } from '@/data/types'
import { AnimatedNumber, ProgressRing, Tooltip } from '@/components/ui'
import { chunkCount, formatHoursMinutes, minutesBanked, percentComplete } from '@/lib/chunks'
import { cn } from '@/lib/cn'
import { shiftAccentHue } from '@/lib/color'
import { SPRING_SNAPPY, SPRING_SOFT } from '@/lib/motion'
import { ChunkGrid } from './ChunkGrid'

export interface GoalCardProps {
  goal: Goal
  /** Plays a one-time soft accent pulse, then calls onPulseEnd. */
  justCreated?: boolean
  onPulseEnd?: () => void
  /** Overrides the link target (default `/goals/${goal.id}`) — lets the styleguide mount a fixture-backed detail route elsewhere. */
  linkTo?: string
  /** Set to false to skip the mount fade/rise entirely — the dashboard only wants it on its first render per session. */
  animateEntrance?: boolean
  /** Stagger index for the entrance transition's delay (60ms per step). Ignored when animateEntrance is false. */
  entranceIndex?: number
}

/**
 * The card half of the card<->detail-page shared transition. Three
 * layoutIds carry across the route change (all inside the <LayoutGroup
 * id="goals"> in AnimatedRoutes.tsx): the shell (this card's own bordered
 * surface, matching the panel GoalDetail.tsx renders at the same id — kept
 * deliberately symmetric, both carrying their own visible styling directly
 * rather than nesting it in a child, so there's nothing for Motion to
 * "catch up" on mid-flight), the progress area (ring here, numeral on the
 * detail page — the box morphs, the inner content crossfades), and the grid
 * (mini preview here, full interactive grid there).
 *
 * The goal name is NOT given its own layoutId: Motion's layout animation
 * scales an element's box via transform, and doing that to text while its
 * font-size also changes (text-body -> text-title) looks stretched rather
 * than a clean morph — a known rough edge, not worth the risk per "if it
 * glitches, simplify" in the brief. It just crossfades with the rest of the
 * shell's content instead.
 */
export function GoalCard({
  goal,
  justCreated = false,
  onPulseEnd,
  linkTo,
  animateEntrance = true,
  entranceIndex = 0,
}: GoalCardProps) {
  const total = chunkCount(goal.totalMinutes, goal.chunkMinutes)
  const percent = percentComplete(goal.completedChunks, total)
  const banked = minutesBanked(goal.completedChunks, goal.chunkMinutes, goal.carryMinutes)
  const [isAnimatingLayout, setIsAnimatingLayout] = useState(false)

  return (
    <motion.div
      layout
      layoutId={`goal-shell-${goal.id}`}
      initial={animateEntrance ? { opacity: 0, y: 12 } : false}
      animate={{
        opacity: 1,
        y: 0,
        transition: { ...SPRING_SNAPPY, delay: animateEntrance ? entranceIndex * 0.06 : 0 },
      }}
      exit={{ opacity: 0, y: -8 }}
      whileHover={{ y: -2 }}
      transition={SPRING_SNAPPY}
      onLayoutAnimationStart={() => setIsAnimatingLayout(true)}
      onLayoutAnimationComplete={() => setIsAnimatingLayout(false)}
      className={cn(
        '@container relative rounded-xl border border-hairline bg-surface p-6 transition-colors hover:border-white/10',
        isAnimatingLayout && 'z-raised',
      )}
      style={{
        boxShadow: 'inset 0 1px 0 0 var(--hairline)',
        ...(justCreated ? { animation: 'goal-pulse 1200ms var(--ease-out) forwards' } : undefined),
      }}
      onAnimationEnd={justCreated ? onPulseEnd : undefined}
    >
      {/* Accent hairline that grows with progress — overlays the shell's own top edge. */}
      <motion.div
        aria-hidden="true"
        className="absolute top-0 left-0 h-[2px] w-full rounded-t-xl"
        style={{ transformOrigin: 'left', backgroundColor: shiftAccentHue(goal.hue) }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: percent / 100 }}
        transition={SPRING_SOFT}
      />

      <Link to={linkTo ?? `/goals/${goal.id}`} className="flex flex-col gap-4 @sm:flex-row @sm:items-center @sm:gap-6">
        <div className="order-1 flex min-w-0 flex-col gap-1">
          <Tooltip content={goal.name}>
            <h3 className="truncate text-[length:var(--text-body)] font-medium text-text">{goal.name}</h3>
          </Tooltip>
          <span className="truncate text-[length:var(--text-small)] text-text-2">
            {formatHoursMinutes(banked)} of {formatHoursMinutes(goal.totalMinutes)}
          </span>
        </div>

        <motion.div
          layout
          layoutId={`goal-progress-${goal.id}`}
          className="relative order-2 flex h-[72px] w-[72px] shrink-0 items-center justify-center @sm:order-3 @sm:ml-auto"
        >
          <ProgressRing progress={percent / 100} size={72} strokeWidth={6} />
          <AnimatedNumber
            value={Math.round(percent)}
            format={(value) => `${Math.round(value)}%`}
            className="absolute text-[length:var(--text-small)] text-text"
          />
        </motion.div>

        <motion.div layout layoutId={`goal-grid-${goal.id}`} className="order-3 @sm:order-2 @sm:flex-1">
          <ChunkGrid
            total={total}
            completed={goal.completedChunks}
            chunkMinutes={goal.chunkMinutes}
            accentShade={goal.hue}
            size="sm"
            className="max-h-24 overflow-hidden"
          />
        </motion.div>
      </Link>
    </motion.div>
  )
}
